$(function() {
	var FADE_TIME = 150; // ms
	var TYPING_TIMER_LENGTH = 400; // ms
	var COLORS = [
		'#e21400', '#91580f', '#f8a700', '#f78b00',
		'#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
		'#3b88eb', '#3824aa', '#a700ff', '#d300e7'
	];

	// Initialize variables
	var $window = $(window);
	var $nickInput = $('.nickInput');
	var $messages = $('.messages');
	var $inputMessage = $('.inputMessage');
	var $usersList = $('.users');

	var $loginArea = $('.loginArea');
	var $chatArea = $('.chatArea');

	// Prompt for setting a nickname
	var nick;
	var connected = false;
	var typing = false;
	var lastTypingTime;
	var $currentInput = $nickInput.focus();

	var socket = io();

	function addParticipantsMessage (data) {
		var message = '';
		if (data.numUsers === 1) {
			message += "there is 1 participant";
		} else {
			message += "there are " + data.numUsers + " participants";
		}
		log(message);
	}

	// set the client's nickname
	function setNick () {
		nick = cleanInput($nickInput.val().trim());

		if (nick) {
			$loginArea.fadeOut();
			$chatArea.show();
			$loginArea.off('click');
			$currentInput = $inputMessage.focus();

			// Tell the server your nick
			socket.emit('add user', nick);
		}
	}

	// Send a chat message
	function sendMessage() {
		var message = $inputMessage.val();

		// Prevent markup from being injected into the message
		message = cleanInput(message);
		if (message && connected) {
			// console.log(message);
			$inputMessage.val('');
			addChatMessage({
				nick: nick,
				message: message
			});
			data = {nick: nick, message: message};
			// tell server to execute 'new message' and send along one parameter
			socket.emit('new message', data);
		}
	}

	// Log a message
	function log (message, options) {
		var $el = $('<li>').addClass('log').html(message);
		addMessageElement($el, options);
	}

	// update users list
	function updateUsersList (nick, option) {
		// console.log(nick + ' : ' + option);
		if (option) {
			var $userDiv = $('<li class="user list-group-item"/>')
				.text(nick);
			$usersList.append($userDiv);
		} else {
			var $target = $('.user').filter(function (i) {
				return $(this).text() === nick;
			});
			console.log('left: ' + $target.toString());
			$target.fadeOut(function () {
				$(this).remove();
			});
		}
	}

	// Add the visual chat message to the message list
	function addChatMessage (data, options) {
		// DOn't fade the message if there is an 'X was typing'
		var $typingMessages = getTypingMessages(data);
		options = options || {};
		if ($typingMessages.length !== 0) {
			options.fade = false;
			$typingMessages.remove();
		}

		var $nickDiv = $('<span class="nick"/>')
			.text(data.nick)
			.css('color', getNickColor(data.nick));
		var $messageBodyDiv = $('<span class ="messageBody">')
			.text(data.message);
		// console.log(data.message);
		var typingClass = data.typing ? 'typing' : '';
		var $messageDiv = $('<li class="message"/>')
			.data('nick', data.nick)
			.addClass(typingClass)
			.append($nickDiv, $messageBodyDiv);

		addMessageElement($messageDiv, options);
	}


	// Adds the visual chat typing message
	function addChatTyping (data) {
		data.typing = true;
		data.message = 'is typing';
		addChatMessage(data);
	}

	// Removes the visual chat typing message
	function removeChatTyping (data) {
		// console.log(data);
		getTypingMessages(data).fadeOut(function () {
			$(this).remove();
		});
	}

	function addMessageElement(el, options) {
		var $el = $(el);

		// Setup default options
		if (!options) {
			options = {};
		}
		if (typeof options.fade === 'undefined') {
			options.fade = true;
		}
		if (typeof options.prepend === 'undefined') {
			options.prepend = false;
		}

		// Aply options
		if (options.fade) {
			$el.hide().fadeIn(FADE_TIME);
		}
		if (options.prepend) {
			$messages.prepend($el);
		} else {
			$messages.append($el);
		}
		$messages[0].scrollTop = $messages[0].scrollHeight;
	}

	// Prevents input from having injected markup
	function cleanInput (input) {
		return $('<div/>').text(input).text();
	}

	// Update the typing event
	function updateTyping () {
		if (connected) {
			if (!typing) {
				typing = true;
				socket.emit('typing', {nick: socket.nick});
			}
			lastTypingTime = (new Date()).getTime();

			setTimeout(function () {
				var typingTimer = (new Date()).getTime();
				var timeDiff = typingTimer - lastTypingTime;
				if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
					socket.emit('stop typing');
					typing = false;
				}
			}, TYPING_TIMER_LENGTH);
		}
	}

	// Get the 'X is typing' message of a user
	function getTypingMessages (data) {
		return $('.typing').filter(function (i) {
			return $(this).data('nick') === data.nick;
		});
	}

	// Gets the color of a username through our hash function
	function getNickColor (nick) {
		// compute the has code
		var hash = 7;
		for (var i = 0; i < nick.length; ++i) {
			hash = nick.charCodeAt(i) + (hash << 5) - hash;
		}
		var index = Math.abs(hash % COLORS.length);
		return COLORS[index];
	}

	// Keyboard Events

	$window.keydown(function (event) {
		// Auto focus the current input when is typed
		if (!(event.ctrlKey || event.metaKey || event.altKey)) {
			$currentInput.focus();
		}
		// when the client hits ENTER 
		if (event.which === 13) {
			if (nick) {
				// console.log(nick);
				sendMessage();
				socket.emit('stop typing');
				typing = false;
			} else {
				setNick();
			}
		}
	});

	$inputMessage.on('input', function () {
		updateTyping();
	})

	// Click events

	// Focus input when clicking anywhere on login page
	$loginArea.click(function () {
		$currentInput.focus();
	});

	// Focus input when clicking on the message input's border
	$inputMessage.click(function () {
		$inputMessage.focus();
	});

	// Socket events

	// Whenever the server emits 'login', log the login message
	socket.on('login', function (data) {
	    connected = true;
	    // Display the welcome message
	    var message = "Welcome to Beks Chat – ";
	    log(message, {
			prepend: true
	    });
	    addParticipantsMessage(data);
	});

	// Whenever the server emits 'new message', update the chat body
	socket.on('new message', function (data) {
		addChatMessage(data);
	});

	function userUpdateLog(nick, status) {
		var $el = $('<span class="nick">')
			.text(nick)
			.css('color', 'black')
			.after('<div>left</div>');
		var $div = $('<li>').addClass('log').append($el, status);
		addMessageElement($div);
	}

	// Whenever the server emits 'user joined', log it in the chat body
	socket.on('user joined', function (data) {
		userUpdateLog(data.nick, 'joined');
		addParticipantsMessage(data);
		updateUsersList(data.nick, true);
	})
;
	// Whenever the server emits 'user left', log it in the chat body
	socket.on('user left', function (data) {
		userUpdateLog(data.nick, 'left');
		addParticipantsMessage(data);
		removeChatTyping(data);
		updateUsersList(data.nick, false);
	});

	// Whenever the server emits 'typing', show the typing message
	socket.on('typing', function (data) {
		addChatTyping(data);
	});

	// Whenever the server emits 'stop typing', kill the typing message
	socket.on('stop typing', function (data) {
		removeChatTyping(data);
	});

});