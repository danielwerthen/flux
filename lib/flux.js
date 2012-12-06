var Q = require('q')
	, _ = require('underscore')
	, Node = require('./flux-node')
	, Signal = require('./signal')
	, RemoteNode = require('./node')
	, Map = require('./map')
	, pipe = require('./pipe')
	, httpPipe = require('../lib/httpPipe')
	, cnc = require('./cnc')

var Flux = module.exports = function (options) {
	this.locals = [];
	this.localMap = new Map(this.locals, function (array) { return _.pluck(array, 'executor'); });
	this.remotes = [];
	this.remoteMap = new Map(this.remotes);
	this.signals = {};
};

Flux.prototype = {
	listen: function () {
		var self = this;
		return httpPipe.listen(function (err, data) {
			if (err) return console.dir(err);
			var signal = self.signals[data.signature];
			if (signal) {
				signal.handleCall(data);
			}
		});
	},
	addRemoteNode: function (connection, name, classes) {
		var args = Array.prototype.slice.call(arguments);
		var remote = pipe(connection);
		this.remotes.push(new RemoteNode(remote, name, _.rest(args, 2)));
	},
	addSignal: function (sig) {
		var signal = new Signal(this.localMap, this.remoteMap);
		signal.load(sig);
		if (!this.signals[signal.signature])
			this.signals[signal.signature] = signal;
		else {
			throw new Error('This signal is matching another signal which is already loaded.');
		}
		return signal;
	},
	createNode: function (name, classes) {
		var args = Array.prototype.slice.call(arguments);
		var node = new Node(name, _.rest(args, 1));
		this.locals.push(node);
		return node;
	},
	connect: function (options) {
	}
};
