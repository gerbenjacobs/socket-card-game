// Let's all wait on page load!
$(document).ready(function(){
    var socket = io.connect(location.hostname + ':3000');
    var lobbyList = $("#lobby-list");
    var lobbyCount = $("#lobby-count");
    var playgroundTitle = $("#playground-title");

    $(document).on( "click", ".invite-link", function(){
        var player = $(this).parent().attr("id");
        socket.emit("send_invite", player);
        return false;
    });

    socket.on('connect',function(){
        console.log("Connected to the sever")
    });

    socket.on("welcome", function(user, users) {
       $("#welcome").html("Welcome, you're now known as <strong>"+user.username+"</strong>");
        updateUsers(users);
    });
    socket.on('user_joined', function(user) {
        if (user.socket != socket.id) {
            lobbyCount.text(Number(lobbyCount.text()) + 1);
            lobbyList.append(userEntry(user));
        }
    });

    socket.on('user_left', function(socket) {
        lobbyCount.text(Number(lobbyCount.text()) - 1);
        $("#" + socket).remove();
    });

    socket.on('receive_invite', function(game, player) {
        console.log("Received invite from", player, "for", game);
        if (confirm(player.username + " wants to play a game with you! Do you accept?")) {
            socket.emit("accept_invite", player.socket, game.id);
            startGame(game, player);
        } else {
            socket.emit("decline_invite", player.socket, game.id);
        }
    });

    socket.on('invite_accepted', function(game, player){
        startGame(game, player);
    });

    function userEntry(user) {
        var link = (user.socket != socket.id) ? '<a href="#" class="invite-link">Invite</a> ' : '';
        return '<li id="'+user.socket+'">'+link+user.username+'</li>';
    }

    function updateUsers(users) {
        var list = "";
        var count = 0;
        $.each(users, function(i){
            list += userEntry(users[i]);
            count++; // users has no length attr
        });
        lobbyCount.text(count);
        lobbyList.empty().append(list);
    }

    function startGame(game, player) {
        console.log(game);
        console.log(player);
        playgroundTitle.html(game.id);
    }
});
