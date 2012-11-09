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
		var par = this.scan(/^[\(,] *({.*}|\w+) */, 'param');
		if (par) {
			par.val = par.val.replace(/( *{ *| *, *)\'?(\w+)\'? *: */g, "$1\"$2\": ");
			console.dir(JSON.parse(par.val));
			//console.dir(par);
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
		if (captures = /^(\n?)(\t*) */.exec(this.input)) {
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
		console.log(JSON.stringify({ x: 14 }));
		console.dir(JSON.parse('{ "x": 14 }'));
		var n, list = [];
		while (n = this.next()) list.push(n);
		return list;
	},

	signalify: function () {
		var toks = this.parse();
	}
}

function getParams(tokens) {
	var params = [];
	while(tokens.length && tokens[0].type === 'param') params.push(tokens.shift().val);
	return params;
}

function getSignal(tokens) {
	while(tokens.length && tokens[0].type !== 'func') tokens.shift();
	if (tokens.length && tokens[0].type === 'func') {
		var name = tokens.shift();
		var params = getParams();
		if (params.length > 1)
			throw new Error('Bad initialization of signal at line: ' + name.lineno);
		var s = new Signal(name.val, params.length ? params[0] : {});
	}
}

Signal = function (name, options) {
	this.name = name;
	this.options = options;
	this.execution = [];
};
