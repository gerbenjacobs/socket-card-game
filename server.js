var port = 3000;
var app = require('http').createServer().listen(port);
var io = require('socket.io')(app);
var moniker = require('moniker');


console.log("Server listening on localhost:" + port);

var users = {};
var games = [];

io.on('connection', function (socket) {
    var user = {socket: socket.id, username: moniker.choose(), playing: false};
    users[socket.id] = user;

    socket.emit("welcome", user, users);
    socket.emit("notify", "Testing the notify bar!");
    io.emit("user_joined", user);

    socket.on('debug', function () {
        socket.emit("debug", games, users);
    });

    socket.on('disconnect', function () {
        io.emit("user_left", socket.id);

        for (var key in games) {
            console.log(games);
            if (games.hasOwnProperty(key)) {
                var game = games[key];
                if (game) {
                    if (game.player.socket == socket.id) {
                        io.to(game.invitee.socket).emit("game_crash");
                        users[game.invitee.socket].playing = false;
                    } else if (game.invitee.socket == socket.id) {
                        io.to(game.player.socket).emit("game_crash");
                        users[game.player.socket].playing = false;
                    }
                    delete games[game];
                }
            }
        }

        delete users[socket.id];
    });

    socket.on('send_invite', function (player) {
        if (!users[player].playing) {
            var game_id = moniker.choose();
            var game = {
                id: game_id,
                player: users[socket.id],
                invitee: users[player],
                active: false,
                state: "invited"
            };
            games[game_id] = game;
            io.to(player).emit("receive_invite", game, users[socket.id]);
        } else {
            socket.emit('notify', 'This user is already playing.');
        }
    });

    socket.on('accept_invite', function (player_id, game_id) {
        var game = games[game_id];
        var player = users[player_id];

        // Make game active
        game.state = "playing";
        game.active = true;

        // Make players active
        player.playing = true;
        users[socket.id].playing = true;

        // Send to sender
        io.to(player_id).emit("invite_accepted", game, game.invitee);

    });
    socket.on('decline_invite', function (player_id, game_id) {
        delete games[game_id];

        // Send to sender
        io.to(player_id).emit("notify", "The other player declined your invite.");

    });

});