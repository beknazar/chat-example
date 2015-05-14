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
var nicknames = [];

/********
 * Routes
 ********/

app.get('/', function(req, res){
  // res.sendFile(__dirname + '/index.html');
  res.render('home', {
  	name: app.get('name')
  });
});

app.get('/script.js', function(req, res){
  res.sendFile(__dirname + '/script.js');
});

/********
 * Socket configuration
 ********/

io.on('connection', function(socket){
	// var nick = prompt("Please enter your nickname", "");
	// while (nicknames.indexOf (nick) != -1) {
	// 	nick = prompt("Oops, it's already taken. Please enter different nickname", "");
	// }
	// nicknames.push(nick);
	
	socket.on('chat message', function(msg){
		io.emit('chat message', msg);
	});

	socket.on('disconnect', function(msg) {
		io.emit('user disconnected', 'user is disconnected');
	});

	socket.on('user try', function(msg) {
		if (nicknames.indexOf(msg) != -1) {
			io.emit('user exists', '');
		}
		else {
			nicknames.push(msg);
			io.emit('user connected', msg + ' has entered the chat');
		}
	});
});

/**************
 * Start Server
 **************/

http.listen(app.get('port'), function(){
  console.log('listening on *:3000');
});
