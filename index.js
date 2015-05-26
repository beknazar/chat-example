/*********************
 * Module dependencies
 *********************/

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

/***************
 * Configuration
 ***************/

app.set('port', (process.env.PORT || 3000));
app.use("/assets", express.static(__dirname + '/assets'));

// Jade configuration

app.set('views', './views');
app.set('view engine', 'jade');

// variables of app

app.set('name', 'Simple chat by Bek');

// Chatroom

// usernames which are currently connected to the chat

var usernames = {};
var numUsers = 0;


/********
 * Routes
 ********/

app.get('/', function(req, res){
	res.render('home', {
		name: app.get('name'),
		nicks: usernames
  	});
});

app.get('/script.js', function(req, res){
  res.sendFile(__dirname + '/script.js');
});


/********
 * Socket configuration
 ********/

io.on('connection', function (socket) {
	var addedUser = false;

	// when the client emits 'new message', this listens and executs
	socket.on('new message', function (data) {
		// we tell the client to execute 'new message'
		socket.broadcast.emit('new message', data);
		console.log(socket.nick);
	});

	socket.on('add user', function (nick) {
		// store the nick in the socket session
		socket.nick = nick;
		// add the clients nick to the global list
		usernames[nick] = nick;
		console.log(nick);
		++numUsers;
		addedUser = true;
		socket.emit('login', {
			numUsers: numUsers
		});
		// echo globally (all clients) that a person has connected
		io.sockets.emit('user joined', {
			nick: socket.nick,
			numUsers: numUsers
		});
	});

	// when the client emits 'typing', we broadcast it to others
	socket.on('typing', function () {
		socket.broadcast.emit('typing', {
			nick: socket.nick
		});
	});

	// when the client 'stops typing'
	socket.on('stop typing', function () {
		socket.broadcast.emit('stop typing', {
			nick: socket.nick
		});
	});

	// when user disconnects
	socket.on('disconnect', function () {
		// remove the nick from global list
		if (addedUser) {
			delete usernames[socket.nick];
			--numUsers;

			// echo it globally
			io.sockets.emit('user left', {
				nick: socket.nick,
				numUsers: numUsers
			});
		}
	});
});



/**************
 * Start Server
 **************/

http.listen(app.get('port'), function(){
  console.log('listening on *:3000');
});
