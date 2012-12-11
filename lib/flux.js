var Q = require('q')
	, _ = require('underscore')
	, Node = require('./flux-node')
	, Signal = require('./signal')
	, RemoteNode = require('./node')
	, Map = require('./map')
	, pipe = require('./pipe')
	, httpPipe = require('../lib/httpPipe')
	, Cnc = require('./cnc')

var Flux = module.exports = function (options) {
	this.locals = [];
	this.localMap = new Map(this.locals, function (array) { return _.pluck(array, 'executor'); });
	this.remotes = [];
	this.remoteMap = new Map(this.remotes);
	this.signals = {};
	this._cnc = null;
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
		var rn = Object.create(RemoteNode.prototype);
		RemoteNode.apply(rn, ([ remote ]).concat( _.rest(args, 1)));
		this.remotes.push(rn);
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
		var node = Object.create(Node.prototype);
		Node.apply(node, args);
		this.locals.push(node);
		return node;
	},
	connect: function (options) {
		if (this._cnc) {
			return;
		}
		this._cnc = new Cnc(this, options);
	}
};
