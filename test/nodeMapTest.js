var NodeMap = require('../lib/nodeMap')
	, Parser = require('../lib/parser')
	, Signal = require('../lib/signal')
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
	console.log('Print ' + result);
	callback();
});

NodeB.add('Subtract', { params: ['a', 'b'], args: ['result'] }, function (a, b, callback) {
	callback(a - b);
});

//var p = new Parser(fs.readFileSync('./test/calculus.flu', 'utf-8'));
//var fs = p.signalify();
var sig = fs.readFileSync('./test/calculus.flu', 'utf-8');

map.add('NodeA', NodeA, 'Added', 'Fig');
map.add('NodeB', NodeB, 'Added');

var signal = new Signal(map);
signal.load(sig);
signal.start();

//console.dir(map.resolve(process.argv[2] || 'NodeA'));
