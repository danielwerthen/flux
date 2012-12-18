var Watcher = require('./watcher')
	, EventEmitter = require('events').EventEmitter
	, Signal = require('./signal')
	, _ = require('underscore')
	, util = require('util')

var Loader = function (options) {
	options = options || {};
	this.options = { autostart: true };
	this.options = _.extend(this.options, options);
	
	this._watcher = new Watcher(this.options);
	this._watcher.on('add', _.bind(this._onAdd, this));
	this._watcher.on('update', _.bind(this._onUpdate, this));
	this._watcher.on('remove', _.bind(this._onRemove, this));
	this._watcher.on('error', _.bind(this._onError, this));
};

util.inherits(Loader, EventEmitter);

Loader.prototype._onAdd = function (file) {
};
Loader.prototype._onUpdate = function (file, data) {
	this.emit('signal', data);
};
Loader.prototype._onRemove = function (file) {
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

