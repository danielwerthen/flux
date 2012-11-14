var _ = require('underscore')
	, util = require('./util')
	, Parser = require('./parser')

var Signal = module.exports = function (map) {
	this.map = map;
	this.funcs = [];
	this.signature = '';
	this.toRun = function () { };
};

Signal.prototype = {
	load: function (str) {
		var p = new Parser(str);
		this.funcs = p.signalify();
		this.signature = util.hash(funcsToString(this.funcs));
		this.reset();
	},
	execute: function (f, funcNr, argDir, todo) {
		var self = this;
		var exes = this.map.resolve(f.selector);
		for (var i in exes) {
			var exe = exes[i];
			todo.push(function () {
				exe.call(f.name, build(f.parameters, argDir), function () {
					var args = Array.prototype.slice.call(arguments);
					self.handleCallback(_.flatten([ funcNr, i]), args, argDir);
				});
			});
		}
	},
	reset: function () {
		var self = this;
		var trs = [];
		for (var i in this.funcs) {
			var f = self.funcs[i];
			this.execute(f, [], {}, trs);
			/*var exes = self.map.resolve(f.selector);
			for (var i2 in exes) {
				var exe = exes[i2];
				trs.push(function () {
					exe.call(f.name, build(f.parameters), function () {
						var args = Array.prototype.slice.call(arguments);
						self.handleCallback([i], args);
					});
				});
			}*/
		}
		this.toRun = function () {
			for (var i in trs) {
				trs[i]();
			}
		}
	},
	traverseFunc: function (funcnr) {
		var fs = this.funcs;
		var f = null;
		for (var i in funcnr) {
			var nr = funcnr[i];
			f = fs[nr];
			fs = f.callbacks;
		}
		return f;
	},
	handleCallback: function (funcnr, args, argDir) {
		var f = this.traverseFunc(funcnr);
		var argDir = argDir || {};
		for (var i in f.callbackParameters) {
			var cp = f.callbackParameters[i];
			argDir[cp.val] = args[i];
		}
		var todo = [];
		for (var i in f.callbacks) {
			var c = f.callbacks[i];
			this.execute(c, funcnr, argDir, todo);
		}
		for (var i in todo) {
			todo[i]();
		}
	},
	start: function () {
		this.toRun();
	}
};

function build(arr, argDir) {
	return _.map(arr, function (a) { 
		if (a.type === 'constant')
			return JSON.parse(a.val);	
		if (a.type === 'argument') {
			return argDir[a.val];
		}
	});
}

function funcsToString(funcs) {
	var str = '';
	for (var i in funcs) {
		str += funcs[i].print();
	}
	return str;
}
