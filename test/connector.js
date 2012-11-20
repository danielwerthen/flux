var _ = require('underscore')
	, ns = require('nssocket')
	, Con = require('../lib/connector')

var args = process.argv.splice(2);

var cc = new Con(args[0] || 3000, args.length > 1 ? 'NodeB' : 'NodeA', 'Adder', 'Finder');
cc.start();

for (var i = 1; i < args.length; i++) {
	cc.connect('localhost', args[i]);
}

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
