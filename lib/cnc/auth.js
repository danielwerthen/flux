var fs = require('fs');

exports.getDeviceToken = function (path, callback) {
	if (!callback) {
		callback = path;
		path = undefined;
	}
	fs.readFile((path || './') + '.device.token', 'utf8', function (err, data) {
		if (err) return callback(err);
		callback(null, data);
	});
};

exports.getDeviceTokenSync = function (path) {
	try {
		return fs.readFileSync((path || './') + '.device.token', 'utf8');
	} catch (e) {
		return null;
	}
};

