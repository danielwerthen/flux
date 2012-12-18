var _ = require('underscore')
	, util = require('./util')
	, Parser = require('./parser')
	, EventEmitter = require('events').EventEmitter

var Signal = module.exports = function (locals, remotes) {
	this.locals = locals;
	this.remotes = remotes;
	this.signature = '';
	this.funcs = [];
	this._context = _.extend({ state: {} }, new EventEmitter());
};

Signal.prototype = {
	load: function (str) {
		var p = new Parser(str);
		this.funcs = p.signalify();
		this.signature = util.hash(funcsToString(this.funcs));
	},
	_traverse: function (pos) {
		var fs = this.funcs;
		var f = null;
		for (var i in pos) {
			var p = pos[i];
			f = fs[p];
			fs = f.callbacks;
		}
		return f;
	},
	_getExecutors: function (selector, local) {
		var exes = this.locals.resolve(selector);
		if (local || !this.remotes)
			return exes;
		return exes.concat(this.remotes.resolve(selector));
	},
	interpolate: function (params, args, oldScope) {
		var scope = JSON.parse(JSON.stringify(oldScope));
		for (var i in params) {
			var cp = params[i];
			scope[cp.val] = args[i];
		}
		return scope;
	},
	_getContext: function () {
		return this._context;
	},
	execute: function (pos, scope, local) {
		var f = this._traverse(pos)
			, self = this;
		if (!f) return;
		_(this.locals.resolve(f.selector)).each(function (exe) {
			var params = build(f.parameters, scope);
			exe.call(self._getContext(), f.name, params, function () {
				var args = Array.prototype.slice.call(arguments);
				var newScope = self.interpolate(f.callbackParameters, args, scope);
				for (var i in f.callbacks) {
					self.execute(pos.concat(i), newScope);
				}
			});
		});
		if (local) return;
		_(this.remotes.resolve(f.selector)).each(function (exe) {
			var data = { signature: self.signature, pos: pos, scope: scope };
			exe.send(data);
		});
	},
	handleCall: function (data) {
		if (data.signature === this.signature) {
			this.execute(data.pos, data.scope, true);
		}
	},
	start: function () {
		var self = this;
		for (var i in self.funcs) {
			self.execute([i], {}, true);
		}
	},
	stop: function () {
		this._context.emit('stop');
	}
};

function resolve(str, argDir) {
	for (var i in _.keys(argDir)) {
		var name = _.keys(argDir)[i];
		argDir = argDir || {};
		var re = new RegExp("(: *)(" + name + ")");
		str = str.replace(new RegExp("(: *)(" + name + ")"), "$1" + argDir[name]);
	}
	return str;
}

function build(arr, argDir) {
	return _.map(arr, function (a) { 
		if (a.type === 'string')
			return a.val;
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
