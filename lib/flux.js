var Q = require('q')
	, _ = require('underscore')
	, Node = require('./flux-node')
	, Signal = require('./signal')
	, RemoteNode = require('./node')
	, Map = require('./map')
	, pipe = require('./pipe')
	, httpPipe = require('../lib/httpPipe')
	, Loader = require('./signalLoader')

var Flux = module.exports = function (options) {
	var self = this;
	this.options = options;
	this.locals = [];
	this.localMap = new Map(this.locals, function (array) { return _.pluck(array, 'executor'); });
	this.remotes = [];
	this.remoteMap = new Map(this.remotes);
	this.loader = new Loader(function (name) {
		return new Signal(self.localMap, self.remoteMap);
	}, this.options);
};

Flux.prototype = {
	listen: function (options) {
		var self = this;
		return httpPipe.listen(options, function (err, data) {
			if (err) return console.dir(err);
			var signal = self.loader.get(data.signature);
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
	createNode: function (name, classes) {
		var args = Array.prototype.slice.call(arguments);
		var node = Object.create(Node.prototype);
		Node.apply(node, args);
		this.locals.push(node);
		return node;
	},
	start: function () {
		this.loader.start();
	},
	stop: function () {
		this.loader.stop();
	}
};
