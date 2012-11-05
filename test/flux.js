var mocha = require('mocha');
var chai = require('chai');
var expect = chai.expect;
var cap = require('chai-as-promised');

var flux = require('../index')
	, util = require('../lib/util')

chai.use(cap);

describe('Flux', function () {
	it('should connect properly', function (done) {
		flux.start({ port: 3000 }, function (err) {
		});
		flux.start({ port: 3001, nodes: [ { port: 3000, host: 'localhost' } ] }, function (err) {
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
