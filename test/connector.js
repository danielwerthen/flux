var _ = require('underscore')
	, ns = require('nssocket')
	, Connector = require('../lib/connector')

var args = process.argv.splice(2);

var cc = new Connector(args[0] || 3000, args.length > 1 ? 'NodeA' : 'NodeB', 'Adder', 'Finder');
cc.start();

for (var i = 1; i < args.length; i++) {
	cc.connect('localhost', args[i]);
}

var isa = args.length === 1;
var NodeMap = require('../lib/nodeMap')
	, Parser = require('../lib/parser')
	, Signal = require('../lib/signal')
	, fs = require('fs')
	, map = new NodeMap();

var sig = fs.readFileSync('./test/calculus2.flu', 'utf-8');


var signal = new Signal(map, cc);
function Add(a, b, callback) {
	console.log('adding');
	callback(a + b);
}

var Executor = require('../lib/executor')
if (!isa) {
	var NodeA = new Executor();
	NodeA.add('Add', { params: ['a', 'b'], args: ['result'] }, Add);

	NodeA.add('Print', { params: ['result'] }, function (result, callback) {
		console.log('Print: ');
		console.dir(result);
		callback();
	});
	map.add('NodeA', NodeA, 'Added', 'Fig');
}
else {
	var NodeB = new Executor();
	NodeB.add('Subtract', { params: ['a', 'b'], args: ['result'] }, function (a, b, callback) {
		console.log('subtracting');
		callback(a - b);
	});
	NodeB.add('Print', { params: ['result'] }, function (result, callback) {
		console.log('Print: ');
		console.dir(result);
		callback();
	});
	map.add('NodeB', NodeB, 'Added');
}

cc.on(['attached', 'node'], function (node) {
	setTimeout(function () {
		signal.load(sig);
		signal.start();
	}, 2000);
});

cc.on(['function', 'call'], function (data) {
	var p = data.package;
	signal.handleCall(p);
});

/*var server = ns.createServer(function (socket) {
	socket.send(['you', 'there']);
	socket.data(['iam', 'here'], function (data) {
		console.dir(data);
	});
});
server.listen(args[0]);

if (args[1]) {
	var outbound = new ns.NsSocket();
	outbound.data(['you', 'there'], function () {
		outbound.send(['iam', 'here'], { iam: true, indeedHere: true });
	});
	outbound.connect(args[1]);
}*/
