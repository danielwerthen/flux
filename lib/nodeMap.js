var _ = require('underscore');

var NodeMap = module.exports = function () {
	this.nodes = [];
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
		if (!selector || selector === '') return [];
		var nameCap = /^(\w*)/.exec(selector)
			, classCap = /\.(\w+)\.?(\w*)\.?(\w*)\.?(\w*)\.?(\w*)/g.exec(selector)
		var name, classes = [];
		if (nameCap)
			name = nameCap[1];
		if (classCap) {
			classes = _.compact(_.rest(classCap));
		}
		if (name) {
			return _.pluck(_.filter(this.nodes, function (node) { return node.name === name; }), 'node');
		}
		else if (classes.length) {
			return _.pluck(_.filter(this.nodes, function (node) {
				return _.all(classes, function (cls) { return _.contains(node.classes, cls); });
			}), 'node') ;
		}
		return [];
			
	}
};

var Node = function (name, node, classes) {
	this.name = name;
	this.node = node;
	this.classes = classes;
};
