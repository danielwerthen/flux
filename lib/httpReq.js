var https = require('https')
	, _ = require('underscore')

exports.req = function (path, options, callback) {
	options = options || {};
	if (_.isFunction(options) && !callback) {
		callback = options;
	}
	options.hostname = options.hostname || 'localhost';
	options.port = options.port || '3000';
	options.path = path || '/';
	options.method = options.method || 'POST';
	options.headers = { 'content-type': 'application/json' };

	var req = https.request(options, function (res) {
		res.setEncoding('utf8');
		var buf = "";
		res.on('data', function (chunk) {
			buf += chunk;
		});
		res.on('error', function (e) {
			callback(e);
		});
		res.on('end', function () {
			var result;
			if (res.headers['content-type'] === 'application/json')
				result = JSON.parse(buf);
			else
				result = buf;
			if (res.statusCode !== 200) {
				return callback(result);
			}
			callback(null, result);
		});
	});

	req.on('error', function (e) {
		callback(e);
	});

	if (options.data)
		req.write(JSON.stringify(data));
	req.end();
};
