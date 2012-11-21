var _ = require('underscore')
	, util = require('./util')
	, Parser = require('./parser')

var Signal = module.exports = function (localMap, remoteMap) {
	this.localMap = localMap;
	this.remoteMap = remoteMap;
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
	buildExecution: function (f, exe, funcNr, argDir) {
		var self = this;
		return function () {
			exe.call(f.name, build(f.parameters, argDir), function () {
				var args = Array.prototype.slice.call(arguments);
				self.handleCallback(funcNr, args, argDir);
			});
		};
	},
	buildRemoteExecution: function (f, ext, funcNr, argDir) {
		var self = this;
		return function () {
			ext.remoteCall({
				signal: self.signature,
				functionName: f.name,
				functionId: funcNr,
				scope: argDir
			});
		};
	},
	remoteCall: function (package) {
		var todo = []
			, f = this.traverseFunc(package.functionId);
		this.execute(f, package.functionId, package.scope, todo, true);
		for (var i in todo) {
			todo[i]();
		}
	},
	execute: function (f, funcNr, argDir, todo, local) {
		var self = this;
		var exes = this.localMap.resolve(f.selector);
		for (var i in exes) {
			var exe = exes[i];
			todo.push(this.buildExecution(f, exe, funcNr, argDir));
		}
		if (this.remoteMap && !local) {
			var exts = this.remoteMap.resolve(f.selector, true);
			for (var i in exts) {
				var ext = exts[i];
				todo.push(this.buildRemoteExecution(f, ext, funcNr, argDir));
			}
		}
	},
	reset: function () {
		var self = this;
		var trs = [];
		for (var i in this.funcs) {
			var f = self.funcs[i];
			this.execute(f, [i], {}, trs, true);
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
			this.execute(c, _.flatten([funcnr, i]), _.clone(argDir), todo);
		}
		for (var i in todo) {
			todo[i]();
		}
	},
	start: function () {
		this.toRun();
	}
};

function resolve(str, argDir) {
	for (var i in _.keys(argDir)) {
		var name = _.keys(argDir)[i];
		argDir = argDir || { result: 15 };
		var re = new RegExp("(: *)(" + name + ")");
		str = str.replace(new RegExp("(: *)(" + name + ")"), "$1" + argDir[name]);
	}
	return str;
}

function build(arr, argDir) {
	return _.map(arr, function (a) { 
		if (a.type === 'constant')
			return JSON.parse(a.val);	
		if (a.type === 'argument') {
			if (/{/.exec(a.val)) {
				var str = resolve(a.val, argDir);
				return JSON.parse(resolve(a.val, argDir));
			}
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
