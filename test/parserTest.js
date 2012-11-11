var Parser = require('../lib/parser.js')
	, fs = require('fs')

var p = new Parser(fs.readFileSync('./test/sample.flu', 'utf-8'));
var fs = p.signalify();
for (var i in fs) {
	fs[i].print();
}
