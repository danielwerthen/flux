var fs = require('fs')
	, path = require('path')
	, util = require('util')
	, EventEmitter = require('events').EventEmitter
	, _ = require('underscore')
	, root = path.normalize(process.cwd())

var Watcher = function (options) {
	options = options || {};
	this.options = { ext: '.is', 
		path: '/signals',
		encoding: 'utf-8',
		delay: 250 };
	this.options = _.extend(this.options, options);
	this._fws = {};
};

util.inherits(Watcher, EventEmitter);

module.exports = Watcher;

Watcher.prototype._watchDir = _watchDir;
function _watchDir(dir) {
	var self = this;
	fs.readdir(dir, function (err, files) {
		if (err || !files) return self.emit('error', err);
		_.each(files, function (file) {
			self._watchFile(dir, file);
		});

		_(_.keys(self._fws))
			.difference(files)
			.map(function (toDelete) {
				if (self._fws[toDelete]) {
					self._fws[toDelete].close();
					self._fws[toDelete] = undefined;
					self.emit('remove', toDelete);
				}
			});
	});
}

Watcher.prototype._watchFile = _watchFile;
function _watchFile(dir, file) {
	var self = this;
	if (self._fws[file] || path.extname(file) !== self.options.ext) return;
	var oneRead;

	function read() {
		setTimeout(function () {
			self._readFile(dir, file);
			oneRead = _.once(read);
		}, self.options.delay);
	}
	oneRead = _.once(read);
	oneRead();
	self.emit('add', file);
	self._fws[file] = fs.watch(dir + '/' + file, function (event) {
		oneRead();
	});
}

Watcher.prototype._readFile = _readFile;
function _readFile(dir, file) {
	var self = this;
	var full = dir + '/' + file;
	fs.exists(full, function (exists) {
		if (!exists) return;
		fs.readFile(full, self.options.encoding, function (err, data) {
			self.emit('update', file, data);
		});
	});
}

Watcher.prototype.start = start;
function start() {
	var self = this;
	var dir = root + self.options.path;

	var oneDir;
	function readDir() {
		setTimeout(function () {
			self._watchDir(dir);
			oneDir = _.once(readDir);
		}, self.options.delay);
	}
	oneDir = _.once(readDir);
	oneDir();

	var watcher = fs.watch(dir, function (event, filename) {
		oneDir();
	});
	watcher.on('error', function (err) {
		self.emit('error', err);
	});
	self._stop = _.once(function () {
		watcher.stop();
	});
}

Watcher.prototype.stop = function () {
	if (this._stop) {
		this._stop();
	}
}
