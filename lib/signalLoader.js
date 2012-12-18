var Watcher = require('./watcher')
	, EventEmitter = require('events').EventEmitter
	, _ = require('underscore')
	, util = require('util')

var Loader = function (createSignal, options) {
	options = options || {};
	this.options = { autostart: true };
	this.options = _.extend(this.options, options);
	this.signals = {};
	this.createSignal = createSignal;
	
	this._watcher = new Watcher(this.options);
	this._watcher.on('add', _.bind(this._onAdd, this));
	this._watcher.on('update', _.bind(this._onUpdate, this));
	this._watcher.on('remove', _.bind(this._onRemove, this));
	this._watcher.on('error', _.bind(this._onError, this));
};

util.inherits(Loader, EventEmitter);

module.exports = Loader;

Loader.prototype._onAdd = function (file) {
	var self = this;
	if (self.signals[file]) {
		self.signals[file].stop();
	}
	self.emit('new', self.signals[file] = self.createSignal(file));
};
Loader.prototype._onUpdate = function (file, data) {
	var self = this;
	if (!self.signals[file]) {
		return;
	}
	self.signals[file].stop();
	self.signals[file] = self.createSignal(file);
	self.signals[file].load(data);
	if (self.options.autostart) self.signals[file].start();
	self.emit('loaded', self.signals[file]);
};
Loader.prototype._onRemove = function (file) {
	var self = this;
	if (self.signals[file]) {
		self.signals[file].stop();
		self.emit('removed', self.signals[file]);
		self.signals[file] = undefined;
	}
};
Loader.prototype._onError = function (err) {
	this.emit('error', err);
};
Loader.prototype.start = function () {
	this._watcher.start();
};
Loader.prototype.stop = function () {
	this._watcher.stop();
};

