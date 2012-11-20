var nssocket = require('nssocket')
	, Q = require('q')
	, _ = require('underscore')

var Connector = module.exports = function (port, name, classes) {
	var args = Array.prototype.slice.call(arguments);
	var self = this;
	this.name = name;
	this.classes = _.rest(args,2);
	this.nodes = {};

	this.server = nssocket.createServer(function (socket) {
		var node = new Node(socket.host, socket.port)
		self.nodes[node.id] = node;
		console.log('connect');
		self._attachSocket(socket, node);
		socket.on('error', function (err) {
			console.dir(err);
			socket.destroy();
			delete self.nodes[node.id];
		});
	});
	this.server.listen(port);
	console.log('listen to port: ' + port);
	this._maintainer = null;
};

Connector.prototype = {
	_attachSocket: function (socket, node) {
		console.log('attached :' + JSON.stringify(socket.socket.remotePort));
		if (!this.nodes[node.id])
			this.nodes[node.id] = new Node(socket.host, socket.port);
		this.nodes[node.id].socket = socket;
		this._listenForId(socket, this.nodes[node.id]);
	},
	connect: function (host, port) {
		var self = this
		var node = new Node(host, port);
		self.nodes[node.id] = node;
		createSocket(host, port, function (socket) {
			self._attachSocket(socket, node);
		});
	},
	_listenForId: function (socket, node) {
		var self = this;
		socket.data(['request', 'id'], function (d) {
			socket.send(['response', 'id'], { name: self.name, classes: self.classes });
		});
		socket.data(['response', 'id'], function (data) {
			node.name = data.name;
			node.classes = data.classes;
			console.dir(data);
		});
	},
	_maintain: function () {
		_(this.nodes).each(function (n) {
			if (n.socket && !n.name) {
				n.socket.send(['request', 'id'], { test: 1243 });
			}
		});
	},
	start: function () {
		if (this._maintainer)
			return;
		var self = this;
		this._maintainer = setInterval(function () {
			self._maintain();
		}, 1000);
	},
	stop: function () {
		if (!this._maintainer)
			return;
		clearInterval(this._maintainer);
		this._maintainer = null;
	}
};

var ids = 0;
var Node = function (host, port) {
	//this.id = host + ':' + port;
	this.id = ids++;
	this.socket = null;
	this.name = null;
	this.classes = [];
};

function createSocket(host, port, callback) {
	var out = new nssocket.NsSocket();
	var reconnect = _.once(function () {
		setTimeout(function () {
			createSocket(host, port, callback);
		}, 1000);
	});
	if (!host || host === 'localhost') {
		out.connect(port, function () {
			callback(out);
		});
	}
	else {
		out.connect(port, host, function () {
			callback(out);
		});
	}
	out.on('error', function (e) {
		console.log('got an error');
		console.dir(e);
		out.destroy();
		reconnect();
	});
}

