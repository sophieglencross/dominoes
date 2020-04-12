const urlParams = new URLSearchParams(window.location.search);
let gameId = urlParams.get('gameId');
let last_update = null;

function get_game_state() {
    const xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            const state = JSON.parse(this.responseText);
            display_game_state(state);
        }
    };
    const url = gameId ? "/view?game_id=" + gameId : "/view";
    xmlHttp.open("GET", url, true); // true for asynchronous
    xmlHttp.send(null);
}

function post(url, data) {
    const xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState === 4) {
            if (xmlHttp.status === 200) {
                const state = JSON.parse(this.responseText);
                display_game_state(state);
            } else if (this.status === 406) {
                alert(this.responseText)
            } else {
                alert("Unexpected error from server: " + xmlHttp.status);
            }
        }
    };

    xmlHttp.open("POST", url, false);
    xmlHttp.send(data);
}

function dominoDrag(ev) {
    const id = ev.target.id;
    ev.dataTransfer.setData("text", id);
}

function allowDropLeft(ev) {
    ev.preventDefault();
}

function allowDropRight(ev) {
    ev.preventDefault();
}

function submitMove(isLeft, leftSpots, rightSpots) {

    const formData = new FormData();
    formData.append("domino_left", leftSpots);
    formData.append("domino_right", rightSpots);
    formData.append("is_left", isLeft);
    formData.append("game_id", gameId);
    post("/submit-move", formData);
}

function dropLeft(ev) {
    ev.preventDefault();
    const id = ev.dataTransfer.getData("text");
    const source = document.getElementById(id);
    const l = source.dataset.left;
    const r = source.dataset.right;
    submitMove(true, l, r)
}

function dropRight(ev) {
    ev.preventDefault();
    const id = ev.dataTransfer.getData("text");
    const source = document.getElementById(id);
    const l = source.dataset.left;
    const r = source.dataset.right;
    submitMove(false, l, r)
}

function submitPickUp() {
    let formData = new FormData()
    formData.append("game_id", gameId);
    post("/pick-up", formData)
}

function submitPass() {
    let formData = new FormData()
    formData.append("game_id", gameId);
    post("/pass", formData);
}

function submitStartGame() {
    let formData = new FormData()
    formData.append("game_id", gameId);
    post("/start-game", formData)
}

function joinNewGame() {
    let formData = new FormData()
    post("/join-any-game", formData)
}

function display_game_state(state) {

    if (state.game_id !== null) {
        gameId = state.game_id
    }
    // Don't display if nothing changed
    if (state.last_update === last_update) {
        return
    }
    last_update = state.last_update

    // History
    const historyNode = document.createElement("div");
    state.history.forEach(function (historyItem) {
        const itemNode = document.createElement("p");
        itemNode.appendChild(document.createTextNode(historyItem[0] + ": " + historyItem[1]));
        historyNode.appendChild(itemNode);
    });
    document.getElementById("history").innerHTML = historyNode.innerHTML;

    // Print board
    document.getElementById("board-dominoes").innerHTML = display_board(state.played_dominoes);
    //Print number of dominoes in stack
    document.getElementById("stack").innerHTML = display_remaining_dominoes(state.remaining_dominoes);

    if (!state.is_started) {
        const canStartGame = state.players.length > 1;
        document.getElementById("big-message").innerHTML = display_start_game_message(canStartGame);
    } else if (state.winner_message) {
        const is_me = state.winner === state.player_number
        document.getElementById("big-message").innerHTML = display_winner_message(is_me, state.winner_message);
    } else {
        document.getElementById("big-message").innerHTML = "";
    }

    // Print players
    const my_player_number = state.player_number;
    const next_player_number = state.next_player_number;
    state.players.forEach(function (player) {
        const playerNode = document.getElementById("player" + player.number);
        const isPlayerTurn = player.number === next_player_number;
        if (player.number !== my_player_number) {
            playerNode.innerHTML = get_other_player_html(player, isPlayerTurn)
        } else {
            playerNode.innerHTML = get_view_player_html(player, isPlayerTurn, state.your_dominoes, state.can_pick_up)
        }
        const isWinner = player.number == state.winner;
        if (isWinner) {
            playerNode.className = "panel is-success"
        } else if (isPlayerTurn) {
            playerNode.className = "panel is-info"
        } else {
            playerNode.className = "panel"
        }
    })
    // Clear any other players
    for (let i = state.players.length; i < 4; i++) {
        const playerNode = document.getElementById("player" + i);
        playerNode.innerHTML = "";
    }

}

function get_other_player_html(player, isPlayerTurn) {
    const playerNode = document.createElement("div");

    const titleNode = document.createElement("p");
    titleNode.className = "panel-heading";
    titleNode.appendChild(document.createTextNode(player.name));
    playerNode.appendChild(titleNode);

    const panelBlock = document.createElement("div");
    panelBlock.className = "panel-block";
    playerNode.appendChild(panelBlock);

    const panelContent = document.createElement("div");
    panelContent.className = "content";
    panelBlock.appendChild(panelContent);

    const dominoes = document.createElement("p");
    dominoes.className = "domino";
    for (let i = 0; i < player.dominoes; i++) {
        const dominoContainer = document.createElement("span");
        dominoContainer.innerHTML = get_blank_domino_html();
        dominoes.appendChild(dominoContainer)
    }
    panelContent.appendChild(dominoes);

    const turnNode = document.createElement("p");
    turnNode.appendChild(document.createTextNode(isPlayerTurn ? player.name + "'s turn" : ""));
    panelContent.appendChild(turnNode);

    return playerNode.innerHTML
}

function get_view_player_html(player, isPlayerTurn, your_dominoes, can_pick_up) {
    const playerNode = document.createElement("div");
    const titleNode = document.createElement("p");
    titleNode.className = "panel-heading";
    titleNode.appendChild(document.createTextNode(player.name + " (YOU)"));
    playerNode.appendChild(titleNode);

    const panelBlock = document.createElement("div");
    panelBlock.className = "panel-block";
    playerNode.appendChild(panelBlock);

    const panelContent = document.createElement("div");
    panelContent.className = "content";
    panelBlock.appendChild(panelContent);

    const dominoes = document.createElement("p");
    your_dominoes.forEach(function (domino) {
        const dominoContainer = document.createElement("span");
        dominoContainer.className = "domino";
        if (isPlayerTurn) {
            dominoContainer.className = "domino selectable-domino"
        }
        dominoContainer.innerHTML = get_domino_html(domino, false, isPlayerTurn);
        dominoes.appendChild(dominoContainer)
    });
    panelContent.appendChild(dominoes);

    if (isPlayerTurn) {
        const controls = document.createElement("div");
        controls.className = "has-text-centered";

        const dragDomino = document.createElement("button");
        dragDomino.className = "button is-success";
        dragDomino.appendChild(document.createTextNode("Drag Domino"));
        controls.appendChild(dragDomino);
        controls.appendChild(document.createTextNode(" "));

        if (can_pick_up) {
            const pickUp = document.createElement("span");
            pickUp.innerHTML = "<button class='button is-warning' onclick='submitPickUp()'>Pick Up</button>";
            controls.appendChild(pickUp)
        } else {
            const pass = document.createElement("span");
            pass.innerHTML = "<button class='button is-danger' onclick='submitPass()'>Pass</button>";
            controls.appendChild(pass)
        }

        playerNode.appendChild(controls)
    }

    return playerNode.innerHTML
}

function display_board(played_dominoes) {
    const dominoes = document.createElement("span");
    played_dominoes.forEach(function (domino) {
        const dominoContainer = document.createElement("span");
        dominoContainer.innerHTML = get_domino_html(domino, true, false);
        dominoes.appendChild(dominoContainer)
    });
    return dominoes.innerHTML
}


function display_start_game_message(canStartGame) {
    const article = document.createElement("article");
    article.className = "panel is-success"

    const heading = document.createElement("p");
    heading.className = "panel-heading";
    heading.appendChild(document.createTextNode("Waiting for more players..."))
    article.appendChild(heading)

    if (canStartGame) {
        const controls = document.createElement("p");
        controls.className = "has-text-centered";
        article.appendChild(controls);
        controls.innerHTML = "<button class='button is-primary' onclick='submitStartGame()'>Start Game</button>";
    }

    return article.outerHTML;
}


function display_winner_message(is_you, message) {
    const article = document.createElement("article");
    if (is_you) {
        article.className = "panel is-success"
    } else {
        article.className = "panel is-danger"
    }

    const heading = document.createElement("p");
    heading.className = "panel-heading";
    heading.appendChild(document.createTextNode("WINNER! " + message))
    article.appendChild(heading)

    const controls = document.createElement("p");
    controls.className = "has-text-centered";
    article.appendChild(controls);
    controls.innerHTML = "<button class='button is-primary' onclick='joinNewGame()'>New Game</button>";

    return article.outerHTML;
}


function display_remaining_dominoes(remaining_dominoes) {
    const dominoes = document.createElement("span");
    const text = document.createTextNode("Dominoes in stack: " + remaining_dominoes);
    dominoes.appendChild(text);
    return dominoes.innerHTML
}


function get_domino_html(domino, onBoard, draggable) {

    let suffix = "";
    if (domino.l === domino.r && onBoard) {
        suffix = "-90"
    }
    return "<img alt='domino " + domino.r + " " + domino.r + "' src='/static/images/" + domino.l + "-" + domino.r + suffix + ".png' " +
        "id='domino-" + domino.l + "-" + domino.r + "' " +
        "data-left='" + domino.l + "' " +
        "data-right='" + domino.r + "' " +
        "draggable=" + draggable + " " +
        "ondragstart='dominoDrag(event)' />";
}

function get_blank_domino_html() {
    return "<img alt='hidden domino' src='/static/images/back.png' draggable=false />"
}

