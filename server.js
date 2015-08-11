var port = 3000;
var app = require('http').createServer().listen(port);
var io = require('socket.io')(app);
var moniker = require('moniker');


console.log("Server listening on localhost:" + port);

var users = {};

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
        io.sockets.connected[player].emit("receive_invite", users[socket.id]);
    });

});