var config = require('./config');
var msgController = require('./controllers/msgController');
var databaseController = require('./controllers/databaseController');

var r = require('rethinkdb');
var WebSocketServer = require('websocket').server;
var express = require('express');
var app = express();
var http = require('http').Server(app);
var webSocketServer;

(function(app) {



	r.connect(config.rethinkdb, function(err, conn) {
        if (err) {
            console.log('Could not open a connection to initialize the database: ' + err.message);
        }
        else {
            console.log('Connected.');
            app.set('rethinkdb.conn', conn);
            databaseController.createDatabase(conn, config.rethinkdb.db)
                .then(function() {
                    return databaseController.createTable(conn, 'message');
                })
				.then(function() {
					return msgController.monitorAllMessages(conn);
				})
                .catch(function(err) {
                    console.log('Error connecting to RethinkDB: ' + err);
                });
        }
    });



	// attach web socket server
	webSocketServer = new WebSocketServer({httpServer: http, autoAcceptConnections: false});
	webSocketServer.on('request', function(request) {
		// route connection to webSocketController
		msgController.onWebSocketConnection(app, request);
	});
})(app);

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// start server on the specified port and binding host
http.listen(config.express.port);

