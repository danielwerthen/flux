var Parser = require('../lib/parser.js')
	, fs = require('fs')
	, _ = require('underscore')

console.dir(_.rest([1,2,3,4,5], 2));

var p = new Parser(fs.readFileSync('./test/sample.flu', 'utf-8'));
var fs = p.signalify();
for (var i in fs) {
	console.log(fs[i].print());
}
var validate = p.validate(fs);
if (!validate.passed) {
	console.log('There is ' + validate.messages.length + ' errors present.');
}
else {
	console.log('Validation passed');
}
for (var i in validate.messages) {
	console.log(validate.messages[i].message);
}
