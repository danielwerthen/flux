var mocha = require('mocha');
var chai = require('chai');
var expect = chai.expect;
var cap = require('chai-as-promised');

var flux = require('../index')
	, util = require('../lib/util')

chai.use(cap);

describe('Flux', function () {
	it('should connect properly', function (done) {
		flux.node.start({ port: 3000, nodes: [ { name: 'NodeB', port: 3001, host: 'localhost' } ] }, function (err, flux) {
			if (err) {
				console.dir(err);
				return;
			}
		});
		flux.node.start({ port: 3001, nodes: [ { name: 'NodeA', port: 3000, host: 'localhost' } ] }, function (err, flux) {
			if (err) {
				console.dir(err);
				return;
			}
			done();
		});
	});
	it('should hash properly', function () {
		var str1 = 'Hash me up good'
			, str2 = 'Test and see if it works'
			, str3 = 'Hash me up good'
		expect(util.hash(str1)).to.equal(util.hash(str3));
		expect(util.hash(str1)).to.not.equal(util.hash(str2));
	});
});
