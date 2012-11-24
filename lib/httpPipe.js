var Map = require('./map')
	, http = require('http')
	, _ = require('underscore')

var HttpPipe = module.exports = function () {
	var self = this;
	this.callback = null;
	this.nodes = [];
	this.map = new Map(function () {
		return _(self.nodes).values();
	});
	console.log('constructor');
};

HttpPipe.prototype = {
	resolve: function (selector, verbose) {
		var t= this.map.resolve(selector, verbose);
		console.dir(t);
		return t;
	},
	on: function (callback) {
		this.callback = callback;
	},
	connect: function (host, port, name, classes) {
		var node = new Node(host, port);
		node.name = name;
		node.classes = [ classes ];
		this.nodes[node.id] = node;
	},
	listen: function (baseUrl) {
		var self = this;
		baseUrl = baseUrl || "";
		return function (req, res, next) {
			if (req.url === baseUrl+'/call') {
				req.setEncoding('utf8');
				var buff = "";
				req.on('data', function(chunk) {
					buff += chunk;
				});
				req.on('end', function() {
					var data = JSON.parse(buff);
					if (self.callback) {
						self.callback(data);
					}
					res.end("hejhopp eller nåt");
				});
			}
			else{
			}
		};	
	}
};

function buildRemoteCall(host, port) {
	return function (data) { 
		var options = {
			host:  host,
			port: port,
			path: '/call',
			method: 'POST'
		};

		var req = http.request(options, function(res) {
			res.setEncoding('utf8');
			res.on('data', function(chunk) {
				console.log(chunk);
			});
		});
		req.write(JSON.stringify(data));
		req.end();
	};
}

var ids = 0;
var Node = function (host, port) {
	//this.id = host + ':' + port;
	this.id = ids++;
	this.name = null;
	this.classes = [];
	this.node = { call: buildRemoteCall(host, port) };
};
