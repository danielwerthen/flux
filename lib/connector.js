var nssocket = require('nssocket')
	, Q = require('q')
	, _ = require('underscore')

var Connector = module.exports = function (port, name, classes) {
	var args = Array.prototype.slice.call(arguments);
	this.name = name;
	this.classes = _.rest(args,2);
	this.nodes = {};
	this.server = nssocket.createServer(function (socket) {
		var node = new Node(socket.host, socket.port)
		nodes[node.id] = node;
		socket.send('id', { name: name, classes: classes });
	});
	this.server.listen(opt.port);
};

var Node = function (host, port) {
	this.id = host + ':' + port;
	this.socket = null;
};
