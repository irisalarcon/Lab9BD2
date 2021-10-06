var msgController = require('../controllers/msgController');
var r = require('rethinkdb');

// when a client is first created it will monitor all messeges
function Client(connection, app) {
    this.connection = connection;
}


Client.prototype.monitorAllMessages = function(app) {

	this.monitoringAllMessages = true;
	// get all the messeges and push to the client
	var webSocketConnection = this.connection;
	msgController.getMessages(app)
		.then(function(msg) {
			for (var i=0; i<msg.length; i++) {
				//var msgJson = JSON.stringify(msg[i], null, 2);
				console.log(JSON.stringify(msg[i]));
				var msgJson = JSON.stringify(msg[i], null, 2);
				webSocketConnection.sendUTF(msgJson);
			}
		})
		.catch(function(err) {
			console.log('Error monitoring all messages: ' + err);
		});
		//webSocketConnection.sendUTF('{"id":1, "message": "hola mundo"}');
	
};


// export the class
module.exports = Client;
