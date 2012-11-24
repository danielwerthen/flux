var http = require('http')
	, Pipe = require('../lib/httpPipe')
	, pipe = new Pipe();

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

