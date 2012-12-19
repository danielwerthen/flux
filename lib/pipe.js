var httpPipe = require('../lib/httpPipe')
	, duplex = require('../lib/duplexPipe')

function getPort(url) {
	var cap = /:(\d+)/.exec(url);
	if (cap) return cap[1];
	return 80;
}

module.exports = function (connection, locals, onData) {
	if (connection.protocol === 'http') {
		return new httpPipe.Pipe({
			host: /^(\w+):?/.exec(connection.url)[1] || 'localhost'
			, port: getPort(connection.url)
		});
	}
	else if (connection.protocol === 'duplex') {
		return new duplex.Pipe({
			host: /^:?\/?\/?(.+):?/.exec(connection.url)[1] || 'localhost'
			, port: getPort(connection.url)
		}, locals.map(function (l) { return { name: l.name, classes: l.classes }; }), onData);
	}
	else {
		throw new Error('Unknown protocol');
	}
};
