var duplex = require('../lib/duplexPipe')
	, http = require('http'); 

http.createServer(duplex.listen(function (err, data) {
	if (err) return console.dir(err);
	console.dir(data);
}, function (nodes, pipe) {
	console.dir(nodes);
	var sint = setInterval(function () {
		pipe.remoteCall({ hello: 5 }, function (err, sent) {
			if (err) console.dir(err);
		});
	}, 450);
	pipe.once('expired', function () {
		console.log('expired');
		clearInterval(sint);
	});
}))
	.listen(3000);

var pipe = new duplex.Pipe({ port: 3000 }, ['Alpha', 'Beta'], function (err, data) {
	if (err) return console.dir(err);
	console.dir(data);
});

var inte = setInterval(function () {
	pipe.remoteCall({ hello: 4 }, function (err, sent) {

	});
}, 1000);

setTimeout(function () {
	clearInterval(inte);
}, 10000);

setTimeout(function () {
	pipe.stop();
}, 12000);
