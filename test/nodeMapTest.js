var NodeMap = require('../lib/nodeMap')
	, map = new NodeMap();

map.add('NodeA', {}, 'Added', 'Fig');

map.resolve(process.argv[2] || 'NodeAbbb');
