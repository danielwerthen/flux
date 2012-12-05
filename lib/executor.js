var _ = require('underscore');
var Executor = module.exports = function () {
	this.funcs = {}
};

Executor.prototype = {
	add: function (name, signature, func) {
		if (_.isFunction(signature) && !func) {
			func = signature;
			signature = {};
		}
		if (this.funcs[name])
			throw new Error('There is already a function of that name, if replacement is necessary, please remove the function first, using remove.');
		this.funcs[name] = new FunctionContext(signature, func); 
	},
	remove: function (name) {
		if (this.funcs[name])
			this.funcs[name] = null;
	},
	call: function (name, args, callback) {
		if (!this.funcs[name])
			throw new Error('No function were found with that name');
		this.funcs[name].func.apply(null, _.flatten([ args, callback ], true));
	}
};

var FunctionContext = function (signature, func) {
	this.signature = signature;
	this.func = func;
}
