var Client = require('../models/client');
var r = require('rethinkdb');

var changesCursor = null;
var clients = [];

module.exports.onWebSocketConnection = function(app, request) {
    console.log(new Date() + ' WebSocket connection accepted.');
   var connection = request.accept(null, request.origin);
	var client = new Client(connection, app);
    clients.push(client);
	// call onMessageReceivedFromClient when a new message is received from the client
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log(new Date() + ' WebSocket server received message: ' + message.utf8Data);
            onMessageReceivedFromClient(client, JSON.parse(message.utf8Data), app);
        }
    });
    connection.on('close', function(reasonCode, description) {
		// remove the client from the array on close
        clients.splice(clients.indexOf(client), 1);
        console.log(new Date() + ' WebSocket client ' + connection.remoteAddress + ' disconnected.');
    });
};


var onMessageReceivedFromClient = function(client, message, app) {
    if (message.monitorAll) {
        console.log(new Date() + ' Request received to monitor all messagess.');
		client.monitorAllMessages(app);
    }
};



module.exports.getMessages = function(app) {
	var conn = app.get('rethinkdb.conn');
	return r.table('message').run(conn).then(function(cursor) {
		return cursor.toArray();
	});
};


module.exports.monitorAllMessages = function(conn) {
	return r.table('message').changes().run(conn)
		.then(function(cursor) {
			changesCursor = cursor;
			cursor.each(function(err, row) {
				console.log(JSON.stringify(row));

				if (err) {
					throw err;
				}
				else {
					// send every message to every client
					//var msgJson = JSON.stringify(row.new_val, null, 2);
					var msgJson = JSON.stringify(row);
					for (var i=0; i<clients.length; i++) {
						if (clients[i].monitoringAllMessages) {
							clients[i].connection.sendUTF(msgJson);
						}
					}
				}
			});
		})
		.catch(function(err) {
			console.log('Error monitoring all messages: ' + err);
		});
};
