var NodeMap = require('../lib/nodeMap')
	, Parser = require('../lib/parser')
	, fs = require('fs')
	, Executor = require('../lib/executor')
	, NodeA = new Executor()
	, NodeB = new Executor()
	, map = new NodeMap();

function Add(a, b, callback) {
	callback(a + b);
}

NodeA.add('Add', { params: ['a', 'b'], args: ['result'] }, Add);

NodeA.add('Print', { params: ['result'] }, function (result, callback) {
	console.log(result);
	callback();
});

NodeB.add('Subtract', { params: ['a', 'b'], args: ['result'] }, function (a, b, callback) {
	callback(a - b);
});

var p = new Parser(fs.readFileSync('./test/calculus.flu', 'utf-8'));
var fs = p.signalify();

console.dir(fs);

/*map.add('NodeA', NodeA, 'Added', 'Fig');
map.add('NodeB', NodeB, 'Added');

console.dir(map.resolve(process.argv[2] || 'NodeA'));*/
