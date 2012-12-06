var io = require('socket.io-client')
	, _ = require('underscore')

var Persis = module.exports = function (opt, newNode) {
	this.options = {
		server: 'https://localhost:3000',
		token: null
	};
	_.extend(this.options, opt);

	this._socket = null;
	this._socketAuthorized = false;
	this._newNode = newNode;
	this._retries = 0;
	this._retry = _.once(retry);
};

function retry() {
	var self = this;
	setTimeout(function () {
		console.log('retry');
		self.authorize();
		if (self._retries < 6)
			self._retry = _.once(retry);
		else {
			console.log('could not authorize persistant connection');
		}
	}, (++self._retries) * 1000);
}

Persis.prototype = {
	authorize: function (retry) {
		var self = this;
		self._socket.emit('authorize', self.options.token);
		if (!_retries) {
			self._retries = 0;
		}
	},
	start: function () {
		var self = this;
		self._socket = io.connect(this.options.server, { secure: !!(/^https:\/\//.exec(self.options.server)) });

		this._socket.on('authorized', function (state) {
			self._socketAuthorized = state;
		});
		self._socket.on('node', function (node) {
			self._newNode(node);
		});
		self.authorize();
	},
	listen: function (selector) {
		if (!this._socket || !this._socketAuthorized) {
			return false;
		}
		this._socket.emit('listen', selector);
		return true;
	}
};
