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
		console.log('new node');
		var node = new Node(socket.host, socket.port)
		self.nodes[node.id] = node;
	socket.send('ping', { test: 4 });
		console.log('opened node');
	});
	this.server.listen(port);
	console.log('listen to port: ' + port);
	this._maintainer = null;
};

Connector.prototype = {
	connect: function (host, port) {
		var def = Q.defer()
			, self = this
		var node = new Node(host, port);
		self.nodes[node.id] = node;
		createSocket(host, port)
			.then(function (socket) {
				self.nodes[node.id].socket = socket;
				def.resolve(node);
			})
			.fail(function (err) {
				self.nodes[node.id].socket = null;
				def.resolve(node);
			});
		return def.promise;
	},
	_listenForId: function (socket, node) {
		socket.data(['request', 'id'], function () {
			socket.send(['response', 'id'], { name: this.name, classes: this.classes });
		});
		socket.data(['response', 'id'], function (data) {
			console.dir(data);
		});
	},
	_maintain: function () {
		_(this.nodes).each(function (n) {
			if (n.socket && !n.name) {
				n.socket.send(['request', 'id']);
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

var Node = function (host, port) {
	this.id = host + ':' + port;
	this.socket = null;
	this.name = null;
	this.classes = [];
};

var net = require('net');
function createSocket(host, port) {
	var def = Q.defer();
	console.log('coco');
	var client = net.connect({ port: port }, function () {
		console.log('con');
		def.resolve(client);
	});
	client.on('end', function () {
		console.log('dis');
	});
	/*var out = new nssocket.NsSocket({ reconnect: true })
	out.connect(port, function () {
		def.resolve(out);
	});
	out.on('error', function (e) {
		console.dir(e);
		def.reject(e);
	});*/
	return def.promise;
}

