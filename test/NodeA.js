var Flux = require('../lib/flux')
	, http = require('http')
	, fs = require('fs')
	
var flux = new Flux();

http.createServer(flux.listen()).listen(3001);

var node = flux.createNode('NodeA', 'Calculator', 'Printer');
var node2 = flux.createNode('NodeC', 'Calculator', 'Printer');

node.addFunction('Interval', function (time, cb) {
	setInterval(cb, time);
});

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

flux.addRemoteNode({ protocol: 'http', url: 'localhost:3002' }, 'NodeB', 'Calculator', 'Printer');

var signal = flux.addSignal(fs.readFileSync('./calculus2.flu', 'utf-8'));
signal.start();

flux.connect({ connections: [ { url: 'http://localhost:3001', global: false, netspace: 'home' } ] }, function (err) {
		if (err) console.log('fail');
		if (err) return console.dir(err);
		return console.log('Flux is loaded');
});
