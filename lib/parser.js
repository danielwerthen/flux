var _ = require('underscore');

var Parser = module.exports = function (str) {
	this.input = str;
	this.lineno = 1;
	this.indentLvl = 0;
	this.indentPrev = 0;
};

Parser.prototype = {

	tok: function (type, val) {
		return {
			type: type
			, line: this.lineno
			, val: val
			, indent: this.indentLvl
		}
	},
	
	consume: function (len) {
		this.input = this.input.substr(len);
	},

	scan: function (regexp, type) {
		var captures;
		if (captures = regexp.exec(this.input)) {
			this.consume(captures[0].length);
			return this.tok(type, captures[1]);
		}
	},

	func: function () {
		return this.scan(/^(\w+) */, 'func');
	},


	selector: function () {
		return this.scan(/^([\w\.]+)\./, 'selector');
	},

	param: function () {
		var par = this.scan(/^[\(,] *({.*}|\[.*\]|\w+|\'.*\'|\".*\") */, 'param');
		if (par) {
			par.val = par.val.replace(/( *{ *| *, *)\'?(\w+)\'? *: */g, "$1\"$2\": ");
		}
		return par;
	},

	paramStop: function () {
		var captures;
		if (captures = /^(\(?\) *)( *=> *| *?)/.exec(this.input)) {
			this.consume(captures[0].length);
			return this.tok('paramStop');
		}
	},

	indents: function () {
		var captures;
		if (captures = /^(\r?\n?)(\t*) */.exec(this.input)) {
			if (!captures[0].length) {
				return;
			}
			this.consume(captures[0].length);
			if (captures[1].length)
				++this.lineno;
			if (captures[2].length > this.indentLvl + 1) {
				throw new Error('Bad indent at ' + this.lineno);
			}
			else {
				this.indentPrev = this.indentLvl;
				this.indentLvl = captures[2].length;
				return this.tok('newline');
			}
		}
	},

	next: function (str) {
		return this.selector()
			|| this.func()
			|| this.param()
			|| this.paramStop()
			|| this.indents();
	},
	
	print: function (str) {
		var r = this[str]();
		if (r && r.val)
			console.log(r.val);
		else if (r)
			console.log(r.type);
		else
			console.log(undefined);
	},

	parse: function () {
		var n, list = [];
		while (n = this.next()) list.push(n);
		return list;
	},

	signalify: function () {
		var toks = this.parse();
		var funcs = [];
		while (toks.length) {
			var f = getFunction(toks);
			if (f)
				funcs.push(f);
		}
		return funcs;
	},
	
	extractArguments: function (funcs, params, args) {
		if (!funcs.length) return;
		params = params || [];
		args = args || [];
		for (var i in funcs) {
			var f = funcs[i];
			for (var c in f.callbackParameters) {
				var cp = f.callbackParameters[c];
				args.push(cp.val);
			}
			for (var p in f.parameters) {
				var para = f.parameters[p];
				if (para.type === 'argument') 
					params.push(para.val);
			}
			this.extractArguments(f.callbacks, params, args);
		}
	},
	
	validate: function (funcs) {
		var args = []
			, params = []
			, invalid = []
			, unused = []
			, result = [];
		this.extractArguments(funcs, params, args);
		invalid = _.uniq(_.difference(params, args));
		unused = _.uniq(_.difference(args, params));
		for (var i in invalid) {
			result.push(new ValidationMessage('Error', 'The parameter ' + invalid[i] + ' could not be bound'));
		}
		for (var i in unused) {
			result.push(new ValidationMessage('Varning', 'The argument ' + unused[i] + ' is not used and should be removed'));
		}
		return { passed: invalid.length === 0, messages: result };
	}
}

var ValidationMessage = function (type, message) {
	this.type = type;
	this.message = message;
};

function isString(str) {
	return /^\'(.*)\'$|^\"(.*)\"$/.exec(str);
}

function getParams(tokens) {
	var params = [];
	while(tokens.length && tokens[0].type === 'param') {
		var param = tokens.shift();
		try {
			var str = isString(param.val);
			if (str) {
				params.push(new Parameter('string', str[1] || str[2]));
			}
			else {
				var obj = JSON.parse(param.val);
				params.push(new Parameter('constant', param.val));
			}
		}
		catch (e) {
			params.push(new Parameter('argument', param.val));
		}
	}
	if (tokens.length && tokens[0].type === 'paramStop')
		tokens.shift();
	return params;
}

function getFunction(tokens) {
	while(tokens.length && tokens[0].type !== 'func' && tokens[0].type !== 'selector' ) tokens.shift();
	if (tokens.length) {
		var name, selector;
		var lineno = tokens[0].lineno;
		var indent = tokens[0].indent;
		if (tokens[0].type === 'selector')
			selector = tokens.shift();
		if (tokens.length && tokens[0].type === 'func')
			name = tokens.shift();
		if (!name)
			throw new Error('Function is missing a name at line: ' + lineno);
		var params = getParams(tokens);
		var f = new Function(selector ? selector.val : null, name.val, params.length ? params : []);
		if (tokens.length && tokens[0].type === 'param') {
		}
		while(tokens.length && tokens[0].indent > indent) {
			if (tokens[0].type === 'param') {
				var args = getParams(tokens);
				if (f.callbackParameters.length > 0) {
					throw new Error('Unknown syntax error at line: ' + tokens[0].lineno);
				}
				f.callbackParameters = args;
			}
			else if (tokens[0].type === 'func' || tokens[0].type === 'selector') {
				var c = getFunction(tokens);
				if (c)
					f.callbacks.push(c);
				else
					throw new Error('Unknown syntax error at line: ' + lineno);
			}
			else {
				tokens.shift();
			}
		}
		return f;
	}
}

var Function = function (selector, name, parameters) {
	this.selector = selector;
	this.name = name;
	this.parameters = parameters;
	this.callbacks = [];
	this.callbackParameters = [];
}

Function.prototype = {
	printParams: function () {
		var str = '';
		for (var i in this.parameters) {
			var para = this.parameters[i];
			if (para.type === "string")
				str += (str !== '' ? ', ' : '') + "\"" + this.parameters[i].val + "\"";
			else
				str += (str !== '' ? ', ' : '') + this.parameters[i].val;
		}
		return '(' + str + ')';
	},
	printCallbackParams: function () {
		var str = '';
		for (var i in this.callbackParameters) {
			str += (str !== '' ? ', ' : '') + this.callbackParameters[i].val;
		}
		return '(' + str + ') =>';
	},
	print: function (indents) {
		indents = indents || '';
		var result = indents + (this.selector ? this.selector + '.' : '') + 
				this.name + this.printParams();
		if (this.callbackParameters.length) {
			indents += '\t';
			result += '\n' + indents + this.printCallbackParams();
		}
		for (var i in this.callbacks) {
			result += '\n' + this.callbacks[i].print(indents + '\t');
		}
		return result;
	}
}

var Parameter = function (type, val) {
	this.type = type;
	this.val = val;
};


