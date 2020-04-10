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
            playerNode.innerHTML = get_view_player_html(player, isPlayerTurn, state.your_dominoes)
        }
        if (isPlayerTurn) {
            playerNode.className = "current-player"
        } else {
            playerNode.className = ""
        }

    })

}

function get_other_player_html(player, isPlayerTurn) {
    var playerNode = document.createElement("div");
    var titleNode = document.createElement("h3");
    titleNode.appendChild(document.createTextNode(player.name));
    playerNode.appendChild(titleNode);
    var dominoes = document.createElement("p");
    dominoes.className = "domino"
    for (var i = 0; i < player.dominoes; i++) {
        var dominoContainer = document.createElement("span")
        dominoContainer.innerHTML = get_blank_domino_html();
        dominoes.appendChild(dominoContainer)
    }
    playerNode.appendChild(dominoes);

    var turnNode = document.createElement("p")
    turnNode.appendChild(document.createTextNode(isPlayerTurn ? player.name + "'s turn" : ""))
    playerNode.appendChild(turnNode)

    return playerNode.innerHTML
}

function get_view_player_html(player, isPlayerTurn, your_dominoes) {
    var playerNode = document.createElement("div");
    var titleNode = document.createElement("h3");
    titleNode.appendChild(document.createTextNode(player.name + " (YOU)"));
    playerNode.appendChild(titleNode);
    var dominoes = document.createElement("p");
    your_dominoes.forEach(function(domino) {
        var dominoContainer = document.createElement("span")
        dominoContainer.className = "domino"
        if (isPlayerTurn) {
            dominoContainer.className = "domino selectable-domino"
            dominoContainer.draggable = true
            dominoContainer.ondragstart="drag(event)"
        }
        dominoContainer.innerHTML = get_domino_html(domino, false);
        dominoes.appendChild(dominoContainer)
    })
    playerNode.appendChild(dominoes);

    var turnNode = document.createElement("p")
    turnNode.appendChild(document.createTextNode(isPlayerTurn ? "Click and drag a domino" : ""))
    playerNode.appendChild(turnNode)


    return playerNode.innerHTML
}

function display_board(played_dominoes){
    var dominoes = document.createElement("span");
    played_dominoes.forEach(function(domino) {
        var dominoContainer = document.createElement("span")
        dominoContainer.innerHTML = get_domino_html(domino, true);
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


function get_domino_html(domino, onBoard) {
    var suffix = "";
    if (domino.l == domino.r && onBoard) {
        suffix = "-90"
    }
    return "<img src='/static/images/" + domino.l + "-" + domino.r + suffix + ".png' />"
}

function get_blank_domino_html() {
    return "<img src='/static/images/back.png' />"
}

function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
  ev.dataTransfer.setData("text", ev.target.id);
}