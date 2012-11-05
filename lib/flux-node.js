var nssocket = require('nssocket')
	, Q = require('q')

function connect(node) {
	var out = new nssocket.NsSocket();
	out.connect(node.port, node.host || 'localhost');
	out.send('ping', { 'hello': 'world!' });
}

exports.start = function (opt, callback) {
	var def = Q.defer();
	if (!opt || !opt.port)
		def.reject(new Error('Needs options and specifically a port'));

	var server = nssocket.createServer(function (socket) {
		socket.data('ping', function (data) {
			console.dir(data);
		});
	});
	server.listen(opt.port);

	if (opt.nodes) {
		for (var i in opt.nodes) {
			connect(opt.nodes[i]);
		}
	}
	def.resolve();

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
