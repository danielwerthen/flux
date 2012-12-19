var Map = require('./map')
	, http = require('http')
	, _ = require('underscore')
	, sl = require('./socketListener')
	, crypto = require('crypto')
	, util = require('util')
	, EventEmitter = require('events').EventEmitter

exports.listen = function (options, callback, duplex) {
	if (!options) options = {};
	var self = this
		, duplex = _.isFunction(options) ? callback : duplex
		, callback = _.isFunction(options) ? options : callback
		, options = _.isFunction(options) ? {} : options
		, baseUrl = options.baseUrl || ""
		, timeout = options.timeout || 30 * 1000
		, delimiter = options.delimiter || '::'
		, encoding = options.encoding || 'utf8'
		, secret = options.secret || 'very_secret_key'
		, idLength = options.idLength || 32
		, rpipes = {}

	return function (req, res, next) {
		if (req.url === baseUrl + '/connect') {
			var auth = false
				, rp = null
				, expire = function () {};
			req.setEncoding(encoding);
			sl.listen(req, options, function (err, data) {
				if (err) return callback(err);
				if (data.nodes && data.secret === secret) {
					var id = data.id || crypto.randomBytes(idLength)
						.toString(options.encoding || 'hex');
					auth = true;
					if (rpipes[id]) {
						rpipes[id]._update(res);
						rp = rpipes[id];
					}
					else {
						rp = rpipes[id] = new RPipe(options, res);
						rp.once('expired', function () {
							console.dir('expired');
							rpipes[id] = undefined;
						});
						duplex(data.nodes, rp);
					}
					expire = _.once(function () {
						rp._expire();
					});
					if (!data.id) {
						res.write(JSON.stringify({ id: id }) + delimiter);
					}
				}
				else {
					callback(null, data);
				}
			});

			req.on('end', function() {
				expire();
				res.end();
			});
			req.on('close', function() {
				expire();
				res.end();
			});
			setTimeout(function () {
				expire();
				res.end();
			}, timeout);
		}
		else{
			if (next) next();
		}
	};	
}

var RPipe = function (options, res) {
	this.delimiter = options.delimiter || '::';
	this.expiration = options.expiration || 10 * 1000;
	this._res = res;
	this._canSend = true;
	this._expireTime = null;
};

util.inherits(RPipe, EventEmitter);

RPipe.prototype = _.extend(RPipe.prototype, {
	canSend: function () {
		return this._canSend;
	},
	_update: function (res) {
		var self = this;
		self._res = res;
		if (self._expireTime) {
			clearTimeout(self._expireTime);
			self._expireTime = null;
		}
	},
	_expire: function () {
		console.log('expire');
		var self = this;
		self._res = null;
		self._canSend = false;
		if (self._expireTime) {
			clearTimeout(self._expireTime);
			self._expireTime = null;
		}
		self._expireTime = setTimeout(function () {
			self.emit('expired');
		}, self.expiration);
	},
	remoteCall: function (data, callback) {
		var self = this;
		if (!self._res) return callback('Connection lost');
		try {
			self._res.write(JSON.stringify(data) + self.delimiter);
			if (callback)
				callback(null, true);
		}
		catch (e) {
			if (callback)
				callback(e, false);
		}
	}
});

var Pipe = exports.Pipe = function (options, nodes, onData) {
	if (!nodes) {
		onData = nodes;
		nodes = options;
		options = {};
	}
	this.host = options.host || 'localhost';
	this.port = options.port || 80;
	this.basePath = options.basePath || '';
	this.timeout = options.timeout || 30 * 1000;
	this.delimiter = options.delimiter || '::';
	this.secret = options.secret || 'very_secret_key';
	this.id = options.id || null;
	this.onData = onData;
	this.nodes = nodes;
	this._req = null;
	this._keepAlive = true;
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
			path: self.basePath + '/connect',
			method: 'POST'
		};
		var close = _.once(function (err) {
			if (self._req === req) {
				self._req = null;
			}
			if (self._keepAlive) {
				self._createReq();
			}
		});
		var req = self._req = http.request(options, function(res) {
			sl.listen(res, options, function (err, data) {
				if (err) return self.onData(err);
				if (data.id) {
					self.id = data.id;
				}
				else {
					self.onData(null, data);
				}
			});
			res.on('error', close);
			res.on('end', close);
			res.on('close', close);
		});
		req.on('error', close);
		req.on('end', close);
		req.on('close', close);
		req.write(JSON.stringify({ id: self.id, secret: self.secret, nodes: self.nodes }) + self.delimiter);
		setTimeout(function () {
			if (!self._req) return;
			self._req.end();
			self._req = null;
		}, self.timeout);
	},
	stop: function () {
		var self = this;
		self._keepAlive = false;
		if (self._req) {
			self._req.end();
		}
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


