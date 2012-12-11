var io = require('socket.io-client')
	, _ = require('underscore')
	, auth = require('./auth')
	, Persis = require('./persistance')
	, hr = require('../httpReq')

var Cnc = module.exports = function (flux, opt) {
	this.options = {
		hostname: 'https://localhost:3000',
		port: 3000,
		basePath: '',
		persistant: true,
		tokenPath: null
	};
	_.extend(this.options, opt);

	this.options.token = this.options.token || auth.getDeviceTokenSync(this.options.tokenPath);

	this._flux = flux;
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
		var opt = _.extend({ method: 'GET' }, this.options);
		opt.data = { deviceToken: this.options.token };
		hr.req('/nodes', opt, callback);
	},
	sendNodes: function (callback) {
		if (!this.options.token)
			return false;
		var opt = _.extend({}, this.options);
		opt.data = { deviceToken: this.options.token
			, nodes: _.map(this._flux.locals, function (el) { return { name: el.name, classes: el.classes }; })
		};
		hr.req('/setNodes', opt, function (err, res) {
			if (err) console.dir(err);
			if (callback) return callback(err, res);
		});
	},
	sendConnections: function (callback) {
		if (!this.options.token)
			return false;
		var opt = _.extend({}, this.options);
		opt.data = { deviceToken: this.options.token
			, nodes: _.map(this._flux.locals, function (el) { return { name: el.name, classes: el.classes }; })
		};
		hr.req('/setConnections', opt, function (err, res) {
			if (err) console.dir(err);
			if (callback) return callback(err, res);
		});
	}
};
