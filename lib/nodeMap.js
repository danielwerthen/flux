var _ = require('underscore')
	, Map = require('./map')

var NodeMap = module.exports = function () {
	this.nodes = [];
	this.map = new Map(this.nodes, function (array) { return _.pluck(array, 'node'); });
};

NodeMap.prototype = {
	add: function (name, node, cls) {
		var args = Array.prototype.slice.call(arguments);
		this.nodes.push(this.self = new Node(name, node, _.rest(args,2)));
	},
	remove: function (name) {
		this.nodes = _.reject(this.nodes, function (node) { return node.name === name; });
	},
	resolve: function (selector) {
		return this.map.resolve(selector);
	}
};

var Node = function (name, node, classes) {
	this.name = name;
	this.node = node;
	this.classes = classes;
};
