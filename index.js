// Setup basic express server
var express = require('express');
var app = express();
var url = require('url');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, function () {
    console.log('Server listening at port %d', port);
});

var chats = {};

io.on('connection', function (socket) {
    // when the client emits 'add user', this listens and executes
    socket.on('add user', function (data) {
        console.log(data);
        socket.join(data.room);
        // we store the username in the socket session for this client
        socket.username = data.username;
        // add the client's username to the global list
        chats[data.room].usernames[data.username] = data.username;
        chats[data.room].numUsers += 1;
        chats[data.room].addedUser = true;
        console.log('broadcast login!');
        console.log(chats);
        console.log(socket.id);
        socket.emit('login', {
            numUsers: chats[data.room].numUsers,
            username: socket.username
        });
        // echo globally (all clients) that a person has connected
        socket.broadcast.to(data.room).emit('user joined', {
            username: socket.username,
            numUsers: chats[data.room].numUsers
        });
    });

    socket.on('start', function (data) {
        chats[socket.id] = {
            usernames: {},
            numUsers: 0,
            addedUser: false
        };
        socket.emit('go chat', {
            socket: socket.id
        }); 
    });

    socket.on('join room', function (room) {
        console.log(room);
    });

});

// Routing
app.use(express.static(__dirname + '/public'));

app.get('/*', function(req, res){
    if(chats[req.url.substring(1)]){
        res.sendFile(__dirname + '/public/chat.html');
    }else{
        res.send('404 - not found. This chat has expired');
    }
});