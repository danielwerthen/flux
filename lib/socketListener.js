var _ = require('underscore');

exports.listen = function (socket, options, callback) {
	if (!options) options = {};
	var self = this
		, callback = _.isFunction(options) ? options : callback
		, options = _.isFunction(options) ? {} : options
		, delimiter = options.delimiter || '::'
		, encoding = options.encoding || 'utf8'
	if (socket.setEncoding) socket.setEncoding(encoding);
	var buf = "";
	socket.on('data', function(chunk) {
		buf += chunk;
		var cap;
		while (cap = (new RegExp("^(.+)" + delimiter)).exec(buf)) {
			buf = buf.substr(cap[0].length);
			try {
				callback(null, JSON.parse(cap[1]));
			}
			catch (e) {
				callback(e);
			}
		}
	});
};
