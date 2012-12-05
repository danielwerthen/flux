var Flux = require('../lib/flux')
	, http = require('http')
	, fs = require('fs')
	
var flux = new Flux();

http.createServer(flux.listen()).listen(3001);

var node = flux.createNode('NodeB', 'Calculator', 'Printer');

node.addFunction('Add', function (a, b, cb) {
	cb(a + b);
});

node.addFunction('Subtract', function (a, b, cb) {
	cb(a - b);
});

node.addFunction('Print', function (a, cb) {
	console.dir(a);
	cb();
});

flux.addRemoteNode({ protocol: 'http', url: 'localhost:3000' }, 'NodeA', 'Calculator', 'Printer');

var signal = flux.addSignal(fs.readFileSync('./test/calculus2.flu', 'utf-8'));
signal.start();

flux.connect();
