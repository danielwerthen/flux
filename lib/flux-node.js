var nssocket = require('nssocket')
	, Q = require('q')
	, _ = require('underscore')

function createSocket(node) {
	var out = new nssocket.NsSocket({ reconnect: true })
		, def = Q.defer();
	out.connect(node.port, node.host || 'localhost', function () {
		def.resolve(out);
	});
	out.on('error', function (e) {
		def.reject(e);
	});
	return def.promise;
}

function createNode(desc) {
	var node = { name: desc.name || null }
		, def = Q.defer();
	createSocket(desc)
		.then(function (socket) {
			node.socket = socket;
			node.connected = true;
			def.resolve(node);
		})
		.fail(function (err) {
			node.connected = false;
			def.resolve(node);
		});
	return def.promise;
}

FluxNode = function () {
	this.nodes = [];
	this.functions = {};
}

FluxNode.prototype.addFunction = function (name, fn) {
	this.functions[name] = fn;
}


exports.start = function (opt, callback) {
	var def = Q.defer()
		, fluxNode = new FluxNode()
	if (!opt || !opt.port)
		def.reject(new Error('Needs options and specifically a port'));

	var server = nssocket.createServer(function (socket) {
		socket.data('ping', function (data) {
			console.dir(data);
		});
	});
	server.listen(opt.port);

	if (opt.nodes) {
		Q.all(
			_.map(opt.nodes, function (desc) {
				return createNode(desc);
			})
		).then(function (nodes) {
			fluxNode.nodes = nodes;
			def.resolve(fluxNode);
		})
		.fail(function (err) {
			def.reject(err);
		});
	}
	else {
		def.resolve(fluxNode);
	}

	if (callback) {
		def.promise.then(function () {
			var args = Array.prototype.slice.call(arguments);
			args.unshift(null);
			callback.apply(null, args);
		})
		.fail(function (err) {
			callback(err);
		});

	} else {
		return def.promise;
	}
}
