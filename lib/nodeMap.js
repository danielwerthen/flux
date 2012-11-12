var _ = require('underscore');

var NodeMap = module.exports = function () {
	this.nodes = [];
};

NodeMap.prototype = {
	add: function (name, node, cls) {
		var args = Array.prototype.slice.call(arguments);
		this.nodes.push(this.self = new Node(name, node, _.rest(args,2)));
	},
	resolve: function (selector) {
		if (!selector || selector === '') return [];
		var nameCap = /^(\w*)/.exec(selector)
			, classCap = /\.(\w+)\.?(\w*)\.?(\w*)\.?(\w*)\.?(\w*)/g.exec(selector)
		var name, classes;
		if (nameCap)
			name = nameCap[1];
		if (classCap) {
			classes = _.compact(_.rest(classCap));
		}
		console.log('Name: ' + name + ' Classes: ');
		console.dir(classes);
			
	}
};

var Node = function (name, node, classes) {
	this.name = name;
	this.node = node;
	this.classes = classes;
};
