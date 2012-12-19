var httpPipe = require('../lib/httpPipe')
	, duplex = require('../lib/duplexPipe')

module.exports = function (connection, locals, onData) {
	if (connection.protocol === 'http') {
		return new httpPipe.Pipe({
			host: /^(\w+):?/.exec(connection.url)[1] || 'localhost'
			, port: /:(\d+)/.exec(connection.url)[1] || 80
		});
	}
	else if (connection.protocol === 'duplex') {
		return new duplex.Pipe({
			host: /^(\w+):?/.exec(connection.url)[1] || 'localhost'
			, port: /:(\d+)/.exec(connection.url)[1] || 80
		}, locals.map(function (l) { return { name: l.name, classes: l.classes }; }), onData);
	}
	else {
		throw new Error('Unknown protocol');
	}
};
