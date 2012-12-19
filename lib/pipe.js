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
		console.dir(locals);
		return new httpPipe.Pipe({
			host: /^(\w+):?/.exec(connection.url)[1] || 'localhost'
			, port: /:(\d+)/.exec(connection.url)[1] || 80
		});
	}
	else {
		throw new Error('Unknown protocol');
	}
};
