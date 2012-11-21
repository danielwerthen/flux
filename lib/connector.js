var nssocket = require('nssocket')
	, Q = require('q')
	, _ = require('underscore')
	, events2 = require('eventemitter2')
	, util = require('util')
	, Map = require('./map')

var Connector = module.exports = function (port, name, classes) {
	var args = Array.prototype.slice.call(arguments);
	var self = this;
	this.name = name;
	this.classes = _.rest(args,2);
	this.nodes = {};
	this.map = new Map(function () {
		return _(self.nodes).values();
	});

	this.server = nssocket.createServer(function (socket) {
		var node = new Node(socket.host, socket.port)
		self.nodes[node.id] = node;
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

	events2.EventEmitter2.call(this, {
		delimiter: this.server._delimiter,
		wildcard: true,
		maxListeners: 10
	});

};

function buildRemoteCall(node) {
	return function (data) {
		node.socket.send(['function', 'call'], data);
	};
}

util.inherits(Connector, events2.EventEmitter2);
_.extend(Connector.prototype
		, {
	_attachSocket: function (socket, node) {
		console.log('attached :' + JSON.stringify(socket.socket.remotePort));
		if (!this.nodes[node.id])
			this.nodes[node.id] = new Node(socket.host, socket.port);
		this.nodes[node.id].socket = socket;
		this._listenForId(socket, this.nodes[node.id]);
		this.emit(['attached', 'node'], this.nodes[node.id]);
		this._listenForFunctionCalls(socket, this.nodes[node.id]);
	},
	connect: function (host, port) {
		var self = this
		createSocket(host, port, function (socket) {
			var node = new Node(host, port);
			self.nodes[node.id] = node;
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
		});
	},
	_listenForFunctionCalls: function (socket, node) {
		var self = this;
		socket.data(['function', 'call'], function (data) {
			self.emit(['function', 'call'], { node: node, package: data });
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
	},
	resolve: function (selector, verbose) {
		return this.map.resolve(selector, verbose);
	}
});

var ids = 0;
var Node = function (host, port) {
	//this.id = host + ':' + port;
	this.id = ids++;
	this.socket = null;
	this.name = null;
	this.classes = [];
	this.node = { call: buildRemoteCall(this) };
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
		console.dir(e);
		out.destroy();
		reconnect();
	});
	out.on('end', function () {
		reconnect();
	});
	out.on('close', function () {
		reconnect();
	});
	out.on('start', function () {
		console.log('connected');
	});
}

