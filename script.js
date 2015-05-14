var socket = io();

$('#register').submit(function() {
	$('#register input').val();
	socket.on('user exists', function(msg) {
		$('#labelError').toggleClass('hidden ');
	});
	$('#nickGet').hide('slow');
	return false;
});

$(document).ready(function() {
	$('#messages').scrollTop($('#messages')[0].scrollHeight);
});

$('.inputArea').submit(function(){
	socket.emit('chat message', $('#m').val());
	$('#m').val('');
	return false;
});


function appendNewLi (msg) {
	$('#messages').scrollTop($('#messages')[0].scrollHeight);
	$('#messages').append($('<li>').text(msg));
	$('#messages').show('slow', function() {
		$('messages').scrollTop($('#messages')[0].scrollHeight);
	});

	$("#messages").animate({
    	scrollTop: $("#messages")[0].scrollHeight
 	},'slow');
}

socket.on('chat message', function(msg) {	
	appendNewLi(msg);
});

socket.on('user connected', function(msg) {
	appendNewLi(msg);
});

socket.on('user disconnected', function(msg) {
	appendNewLi(msg);
});