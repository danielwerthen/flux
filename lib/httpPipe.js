var Map = require('./map')
	, http = require('http')
	, _ = require('underscore')
	, sl = require('./socketListener')

exports.listen = function (options, callback) {
	if (!options) options = {};
	var self = this
		, callback = _.isFunction(options) ? options : callback
		, options = _.isFunction(options) ? {} : options
		, baseUrl = options.baseUrl || ""
		, timeout = options.timeout || 30 * 1000
		, delimiter = options.delimiter || '::'
		, encoding = options.encoding || 'utf8'

	return function (req, res, next) {
		if (req.url === baseUrl + '/call') {
			req.setEncoding(encoding);
			sl.listen(req, options, callback);

			req.on('end', function() {
				res.end();
			});
			req.on('close', function() {
				res.end();
			});
			setTimeout(function () {
				res.end();
			}, timeout);
		}
		else{
			if (next) next();
		}
	};	
}

var Pipe = exports.Pipe = function (options, receiver) {
	this.host = options.host || 'localhost';
	this.port = options.port || 80;
	this.basePath = options.basePath || '';
	this.timeout = options.timeout || 30 * 1000;
	this.delimiter = options.delimiter || '::';
	this.receiver = receiver;
	this._req = null;
};

Pipe.prototype = {
	canSend: function () {
		return true;
	},
	_createReq: function () {
		var self = this;
		var options = {
			host:  self.host,
			port: self.port,
			path: self.basePath + '/call',
			method: 'POST'
		};
		var close = _.once(function () {
			if (self._req === req) {
				self._req = null;
			}
		});
		var req = self._req = http.request(options, function(res) {
			if (self.receiver) {
				self.receiver(self, res);
			}
			res.on('error', close);
			res.on('end', close);
			res.on('close', close);
		});
		req.on('error', close);
		req.on('end', close);
		req.on('close', close);
		setTimeout(function () {
			self._req.end();
			self._req = null;
		}, self.timeout);
	},
	remoteCall: function (data, callback) {
		var self = this;
		try {
			if (!self._req) {
				self._createReq();
			}
			self._req.write(JSON.stringify(data) + self.delimiter);
			if (callback)
				callback(null, true);
		}
		catch (e) {
			if (callback)
				callback(e, false);
		}
	}
};


