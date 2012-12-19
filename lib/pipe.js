var httpPipe = require('../lib/httpPipe')
	, duplex = require('../lib/duplexPipe')
	, url = require('url');

function getPort(parsed) {
	if (parsed.port) return parsed.port;
	if (parsed.protocol) {
		switch (parsed.protocol) {
			case 'https:':
				return 443;
			default:
				return 80;
		}
	}
}

module.exports = function (connection, locals, onData) {
	if (connection.protocol === 'http') {
		var parsed = url.parse(connection.url, true);
		return new httpPipe.Pipe({
			host: parsed.hostname || 'localhost'
			, port: getPort(parsed)
			, protocol: parsed.protocol || 'http:'
		});
	}
	else if (connection.protocol === 'duplex') {
		var parsed = url.parse(connection.url, true);
		return new duplex.Pipe({
			host: parsed.hostname || 'localhost'
			, port: getPort(parsed)
		}, locals.map(function (l) { return { name: l.name, classes: l.classes }; }), onData);
	}
	else {
		throw new Error('Unknown protocol');
	}
};
