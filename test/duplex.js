var Flux = require('../index')
	, http = require('http')

var flux = new Flux();

http.createServer(flux.duplex()).listen(process.env.PORT || 8080);

var node = flux.createNode('Calculator');

node.addFunction('Add', function (a, b, cb) {
	cb(a + b);
});

flux.start();
console.log('Flux is running');
