var http = require('http')
	, httpPipe = require('../lib/httpPipe')
	, sl = require('../lib/socketListener')
	, NodeMap = require('../lib/nodeMap')
	, Map = require('../lib/map')
	, Node = require('../lib/node')
	, Signal = require('../lib/signal')
	, fs = require('fs')
	//, pipe = new Pipe();

var args = process.argv.splice(2);
var nodeA = { self: 3000, remote: 3001, remoteName: 'NodeB' }
var nodeB = { self: 3001, remote: 3000, remoteName: 'NodeA' }
var me = args.length > 0 && args[0] === 'NodeB' ? nodeB : nodeA;

var map = new NodeMap();
var nodes = [];
var remotes = new Map(nodes);
var sig = fs.readFileSync('./test/calculus2.flu', 'utf-8');
var signal = new Signal(map, remotes);

http.createServer(httpPipe.listen(function (err, data) {
	signal.handleCall(data);
})).listen(me.self);

var pipe = new httpPipe.Pipe({ port: me.remote });
nodes.push(new Node(pipe, me.remoteName));

var testExec = {
	call: function (name, args, callback) {
		console.log('Executing name: ' + name);
		callback(4,4,4,4);
	}
};

if (me === nodeA) {
	map.add('NodeA', testExec);
}
else {
	map.add('NodeB', testExec);
}

signal.load(sig);
setTimeout(function () {
	signal.start();
}, 5000);





/*
http.createServer(pipe.listen())
	.listen(3000);

var options = {
	host:  'localhost',
	port: 3000,
	path: '/call',
	method: 'POST'
};

var req = http.request(options, function(res) {
	res.setEncoding('utf8');
	res.on('data', function(chunk) {
		console.log(chunk);
	});
});

var test = {signature: "adfasdf123", functionId: [0,0], scope: {result: 5}};

var data = JSON.stringify(test);
req.write(data.substring(0, 10));
setTimeout(function() {
	req.write(data.substring(11));
	req.end();
}, 1000);
*/
