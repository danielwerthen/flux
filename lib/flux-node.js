var _ = require('underscore')
	, Executor = require('./executor')

var Node = module.exports = function (name, classes) {
	var args = Array.prototype.slice.call(arguments);
	this.name = name;
	this.classes = _.rest(args, 1);
	this.executor = new Executor();
};

Node.prototype = {
	addFunction: function (name, signature, func) {
		this.executor.add.apply(this.executor, Array.prototype.slice.call(arguments));
	},
	removeFunction: function (name) {
		this.executor.add.apply(this.executor, Array.prototype.slice.call(arguments));
	}
};
