// Let's all wait on page load!
$(document).ready(function(){
    var socket = io.connect(location.hostname + ':3000');
    var lobbyList = $("#lobby-list");
    var lobbyCount = $("#lobby-count");
    var notify = $("#notify");
    var playgroundTitle = $("#playground-title");
    var playgroundInvitee = $("#playground-opponent");
    var playgroundCards = $("#playground-cards");
    var me;

    $(document).on( "click", ".invite-link", function(){
        var player = $(this).parent().attr("id");
        socket.emit("send_invite", player);
        return false;
    });

    $("#debug-button").click(function(){
        socket.emit("debug");
    });
    socket.on('debug', function(games, users){
        var debug = "<pre>";
        debug += JSON.stringify(games, null, 2);
        debug += "\n\n";
        debug += JSON.stringify(users, null, 2);
        $("#debug").html(debug);
    });

    socket.on('connect',function(){
        console.log("Connected to the sever")
    });

    socket.on('notify', function(msg){
        notifyUser(msg);
    });

    socket.on("welcome", function(user, users) {
       $("#welcome").html("Welcome, you're now known as <strong>"+user.username+"</strong>");
        me = user;
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

    socket.on('game_crash', function() {
        console.log("Game crash");
        notifyUser("Your opponent left. I'm sorry!");
        playgroundTitle.empty();
        playgroundCards.empty();
        playgroundInvitee.empty();
    });

    socket.on('receive_invite', function(game, player) {
        console.log("Received invite from", player, "for", game);
        if (confirm(player.username + " wants to play a game with you! Do you accept?")) {
            socket.emit("accept_invite", player.socket, game.id);
            startGame(game, player);
            console.log("i got invited and accepted");

        } else {
            socket.emit("decline_invite", player.socket, game.id);
        }
    });

    socket.on('invite_accepted', function(game, player){
        console.log("invite_accepted");
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
        console.log(player);
        console.log(me);
        playgroundTitle.html("Game: " + game.id);
        playgroundInvitee.html("<img src='https://robohash.org/"+player.username+"' alt='"+player.username+"' title='"+player.username+"' width='100'><br>" + player.username);
        playgroundCards.html("<img src='https://robohash.org/"+me.username+"' alt='"+me.username+"' title='"+me.username+"' width='100'><br>" + me.username);
    }

    function notifyUser(msg) {
        notify.html(msg).show();
        setTimeout(function(){
            notify.slideUp(800, function(){
                $(this).empty();
            });
        }, 3000);
    }
});
