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

	parameter: function () {
		return this.scan(/^[\(,] *(\w+) */, 'parameter');
	},

	paramStop: function () {
		var captures;
		if (captures = /^(\) *)( *=> *| *?)/.exec(this.input)) {
			this.consume(captures[0].length);
			return this.tok('paramStop');
		}
	},

	indents: function () {
		var captures;
		if (captures = /^(\n?)(\t*) */.exec(this.input)) {
			if (!captures[0].length) {
				return;
				//return this.tok('eos');
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
			|| this.parameter()
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
		console.log(this.input);
		var n;
		while (n = this.next()) console.dir(n);
		console.log(this.input);
	}
}

