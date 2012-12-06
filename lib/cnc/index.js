var io = require('socket.io-client')
	, _ = require('underscore')
	, auth = require('./auth')
	, Persis = require('./persistance')
	, hr = require('../httpReq')

var Cnc = module.exports = function (opt) {
	this.options = {
		hostname: 'https://localhost:3000',
		port: 3000,
		basePath: '',
		persistant: true,
		tokenPath: null
	};
	_.extend(this.options, opt);

	this.options.token = this.options.token || auth.getDeviceTokenSync(this.options.tokenPath);

	this._listeners = [];

	var self = this;
	this._persis = new Persis(this.options, function (node) {
		self._onNode(node);
	});
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
	getNodes: function (callback) {
		if (!this.options.token)
			return false;
		var opt = _.extend({}, this.options);
		opt.data = { deviceToken: this.options.token };
		hr.req('/nodes', opt, callback);
	},
	createNodes: function (nodes, callback) {
		if (!this.options.token)
			return false;
		var opt = _.extend({}, this.options);
		opt.data = { deviceToken: this.options.token, nodes: nodes };
		hr.req('/createNodes', opt, callback);
	}
};
