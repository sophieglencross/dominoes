
function get_game_state()
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var state = JSON.parse(this.responseText);
            display_game_state(state);
        }
    };
    xmlHttp.open("GET", "/view", true); // true for asynchronous
    xmlHttp.send(null);
}


function dominoDrag(ev) {
    var id = ev.target.id
    ev.dataTransfer.setData("text", id);
}

function allowDropLeft(ev) {
    ev.preventDefault();
}

function allowDropRight(ev) {
    ev.preventDefault();
}

function submitMove(isLeft, leftSpots, rightSpots) {

    var formData = new FormData();
    formData.append("domino_left", leftSpots);
    formData.append("domino_right", rightSpots);
    formData.append("is_left", isLeft);

    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4) {
            if (xmlHttp.status == 200) {
                var state = JSON.parse(this.responseText);
                display_game_state(state);
            } else if (this.status == 406) {
                alert(this.responseText)
            } else {
                alert("Unexpected error from server: " + xmlHttp.status);
            }
        }
    };
    xmlHttp.open("POST", "/submit-move", true); // true for asynchronous
    xmlHttp.send(formData);
}

function dropLeft(ev) {
    ev.preventDefault();
    var id = ev.dataTransfer.getData("text");
    var source = document.getElementById(id);
    var l = source.dataset.left
    var r = source.dataset.right
    submitMove(true, l, r)
}

function dropRight(ev) {
    ev.preventDefault();
    var id = ev.dataTransfer.getData("text");
    var source = document.getElementById(id);
    var l = source.dataset.left
    var r = source.dataset.right
    submitMove(false, l, r)
}

function submitPickUp() {

    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4) {
            if (xmlHttp.status == 200) {
                var state = JSON.parse(this.responseText);
                display_game_state(state);
            } else if (this.status == 406) {
                alert(this.responseText)
            } else {
                alert("Unexpected error from server: " + xmlHttp.status);
            }
        }
    };
    xmlHttp.open("POST", "/pick-up", true); // true for asynchronous
    xmlHttp.send(null);
}


function submitPass() {

    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4) {
            if (xmlHttp.status == 200) {
                var state = JSON.parse(this.responseText);
                display_game_state(state);
            } else if (this.status == 406) {
                alert(this.responseText)
            } else {
                alert("Unexpected error from server: " + xmlHttp.status);
            }
        }
    };
    xmlHttp.open("POST", "/pass", true); // true for asynchronous
    xmlHttp.send(null);
}

function display_game_state(state) {

    // History
    var historyNode = document.createElement("div");
    state.history.forEach(function(historyItem) {
        var itemNode = document.createElement("p");
        itemNode.appendChild(document.createTextNode(historyItem[0] + ": " + historyItem[1]));
        historyNode.appendChild(itemNode);
    })
    document.getElementById("history").innerHTML = historyNode.innerHTML;

    // Print board
    document.getElementById("board-dominoes").innerHTML = display_board(state.played_dominoes)
    //Print number of dominoes in stack
    document.getElementById("stack").innerHTML = display_remaining_dominoes(state.remaining_dominoes)

    // Print players
    var my_player_number = state.player_number
    var next_player_number = state.next_player_number
    state.players.forEach(function(player) {
        var playerNode = document.getElementById("player" + player.number)
        var isPlayerTurn = player.number == next_player_number
        if (player.number != my_player_number) {
            playerNode.innerHTML = get_other_player_html(player, isPlayerTurn)
        } else {
            playerNode.innerHTML = get_view_player_html(player, isPlayerTurn, state.your_dominoes, state.can_pick_up)
        }
        if (isPlayerTurn) {
            playerNode.className = "panel is-success"
        } else {
            playerNode.className = "panel"
        }

    })

}

function get_other_player_html(player, isPlayerTurn) {
    var playerNode = document.createElement("div");

    var titleNode = document.createElement("p");
    titleNode.className = "panel-heading";
    titleNode.appendChild(document.createTextNode(player.name));
    playerNode.appendChild(titleNode);

    var panelBlock = document.createElement("div")
    panelBlock.className = "panel-block"
    playerNode.appendChild(panelBlock)

    var panelContent = document.createElement("div")
    panelContent.className = "content"
    panelBlock.appendChild(panelContent)

    var dominoes = document.createElement("p");
    dominoes.className = "domino"
    for (var i = 0; i < player.dominoes; i++) {
        var dominoContainer = document.createElement("span")
        dominoContainer.innerHTML = get_blank_domino_html();
        dominoes.appendChild(dominoContainer)
    }
    panelContent.appendChild(dominoes);

    var turnNode = document.createElement("p")
    turnNode.appendChild(document.createTextNode(isPlayerTurn ? player.name + "'s turn" : ""))
    panelContent.appendChild(turnNode)

    return playerNode.innerHTML
}

function get_view_player_html(player, isPlayerTurn, your_dominoes, can_pick_up) {
    var playerNode = document.createElement("div");
    var titleNode = document.createElement("p");
    titleNode.className = "panel-heading";
    titleNode.appendChild(document.createTextNode(player.name + " (YOU)"));
    playerNode.appendChild(titleNode);

    var panelBlock = document.createElement("div")
    panelBlock.className = "panel-block"
    playerNode.appendChild(panelBlock)

    var panelContent = document.createElement("div")
    panelContent.className = "content"
    panelBlock.appendChild(panelContent)

    var dominoes = document.createElement("p");
    your_dominoes.forEach(function(domino) {
        var dominoContainer = document.createElement("span")
        dominoContainer.className = "domino"
        if (isPlayerTurn) {
            dominoContainer.className = "domino selectable-domino"
        }
        dominoContainer.innerHTML = get_domino_html(domino, false, isPlayerTurn);
        dominoes.appendChild(dominoContainer)
    })
    panelContent.appendChild(dominoes);

    if (isPlayerTurn) {
        var controls = document.createElement("div")
        controls.className = "has-text-centered";

        var dragDomino = document.createElement("button")
        dragDomino.className = "button is-success"
        dragDomino.appendChild(document.createTextNode("Drag Domino"))
        controls.appendChild(dragDomino)
        controls.appendChild(document.createTextNode(" "))

        if (can_pick_up) {
            var pickUp = document.createElement("span")
            pickUp.innerHTML = "<button class='button is-warning' onclick='submitPickUp()'>Pick Up</button>"
            controls.appendChild(pickUp)
        } else {
            var pass = document.createElement("span")
            pass.innerHTML = "<button class='button is-danger' onclick='submitPass()'>Pass</button>"
            controls.appendChild(pass)
        }

        playerNode.appendChild(controls)
    }

    return playerNode.innerHTML
}

function display_board(played_dominoes){
    var dominoes = document.createElement("span");
    played_dominoes.forEach(function(domino) {
        var dominoContainer = document.createElement("span")
        dominoContainer.innerHTML = get_domino_html(domino, true, false);
        dominoes.appendChild(dominoContainer)
    })
    return dominoes.innerHTML
 }

 function display_remaining_dominoes(remaining_dominoes){
    var dominoes = document.createElement("span");
    var text = document.createTextNode("Dominoes in stack: " + remaining_dominoes)
    dominoes.appendChild(text)
    return dominoes.innerHTML
 }


function get_domino_html(domino, onBoard, draggable) {

    var suffix = "";
    if (domino.l == domino.r && onBoard) {
        suffix = "-90"
    }
    return "<img src='/static/images/" + domino.l + "-" + domino.r + suffix + ".png' " +
           "id='domino-" + domino.l + "-" + domino.r + "' " +
           "data-left='" + domino.l + "' " +
           "data-right='" + domino.r + "' " +
           "draggable=" + draggable + " " +
           "ondragstart='dominoDrag(event)' />";
}

function get_blank_domino_html() {
    return "<img src='/static/images/back.png' draggable=false />"
}

