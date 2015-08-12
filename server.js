var port = 3000;
var app = require('http').createServer().listen(port);
var io = require('socket.io')(app);
var moniker = require('moniker');


console.log("Server listening on localhost:" + port);

var users = {};
var games = {};

io.on('connection', function (socket) {
    var user = {socket: socket.id, username: moniker.choose()};
    users[socket.id] = user;

    socket.emit("welcome", user, users);
    io.emit("user_joined", user);

    socket.on('disconnect', function() {
        delete users[socket.id];
        io.emit("user_left", socket.id)
    });

    socket.on('send_invite', function(player) {
        var game_id = moniker.choose();
        var game = {
            id: game_id,
            player: users[socket.id],
            invitee: users[player],
            active: false,
            state: "invited"
        };
        games[game_id] = game;
        io.sockets.connected[player].emit("receive_invite", game, users[socket.id]);
    });

    socket.on('accept_invite', function(player_id, game_id){
        var game = games[game_id];
        var player = users[player_id];
        game.state = "playing";
        game.active = true;

        // Send to sender
        io.sockets.connected[player_id].emit("invite_accepted", game, player);

    });
    socket.on('accept_decline', function(player_id, game_id){
        var game = games[game_id];
        game.state = "declined";
        game.active = false;

    });

});