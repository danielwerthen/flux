var io = require('socket.io-client')
	, _ = require('underscore')
	, auth = require('./auth')

var Cnc = module.exports = function (opt) {
	this.options = {
		server: 'https://localhost:3000',
		persistant: true,
		tokenPath: null
	};
	_.extend(this.options, opt);

	this.options.token = this.options.token || auth.getDeviceTokenSync(this.options.tokenPath);

	this._socket = null;
	this._socketAuthorized = false;
	this._listeners = [];
};

Cnc.prototype = {
	_onNode: function (node) {
		_.each(this._listeners, function (cb) {
			cb(node);
		});
	},
	onNode: function (callback) {
		this._listeners.add(callback);
	},
	_persist: function (token) {
		var self = this;
		self._socket = io.connect(this.options.server, { secure: !!(/^https:\/\//.exec(self.options.server)) });

		this._socket.on('authorized', function (state) {
			self._socketAuthorized = state;
		});
		self._socket.on('node', function (node) {
			self._onNode(node);
		});
		self._socket.emit('authorize', self.options.token);
	},
	listen: function (selector) {
		if (!this._socket || !this._socketAuthorized) {
			return false;
		}
		this._socket.emit('listen', selector);
	}
};
