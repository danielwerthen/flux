var fs = require('fs')
	, path = require('path')
	, util = require('util')
	, EventEmitter = require('events').EventEmitter
	, emitter = null
	, _ = require('underscore')
	, root = path.normalize(process.cwd())
	, fw = {}
	, funcs = { start: start, stop: function () {} }

module.exports = emitter = _.extend(funcs, new EventEmitter());

function watchDir(dir) {
	fs.readdir(dir, function (err, files) {
		if (err || !files) return emitter.emit('error', err);
		_.each(files, function (file) {
			watchFile(dir, file);
		});

		_(_.keys(fw))
			.difference(files)
			.map(function (toDelete) {
				if (fw[toDelete]) {
					fw[toDelete].close();
					fw[toDelete] = undefined;
					emitter.emit('remove', toDelete);
				}
			});
	});
}

function watchFile(dir, file) {
	if (fw[file] || path.extname(file) !== '.is') return;
	var oneRead;

	function read() {
		setTimeout(function () {
			readFile(dir, file);
			tryRead = _.once(read);
		}, 500);
	}
	oneRead = _.once(read);
	oneRead();
	emitter.emit('add', file);
	fw[file] = fs.watch(dir + '/' + file, function (event) {
		oneRead();
	});
}

function readFile(dir, file) {
	var full = dir + '/' + file;
	fs.exists(full, function (exists) {
		if (!exists) return;
		fs.readFile(full, 'utf-8', function (err, data) {
			emitter.emit('update', file, data);
		});
	});
}

function start(options) {
	options = options || {};
	var dir = root + (options.path || '/scripts');

	var oneDir;
	function readDir() {
		setTimeout(function () {
			watchDir(dir);
			oneDir = _.once(readDir);
		}, 250);
	}
	oneDir = _.once(readDir);
	oneDir();

	var watcher = fs.watch(dir, function (event, filename) {
		oneDir();
	});
	watcher.on('error', function (err) {
		emitter.emit('error', err);
	});
	funcs.stop = _.once(function () {
		watcher.stop();
	});
}


