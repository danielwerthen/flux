var httpPipe = require('../lib/httpPipe')

module.exports = function (connection) {
	if (connection.protocol === 'http') {
		return new httpPipe.Pipe({
			host: /^(\w+):?/.exec(connection.url)[1] || 'localhost'
			, port: /:(\d+)/.exec(connection.url)[1] || 80
		});
	}
	else {
		throw new Error('Unknown protocol');
	}
};
