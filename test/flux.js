var mocha = require('mocha');
var expect = require('chai').expect;

describe('Flux', function () {
	it('should know its version', function () {
		var flux = require('../index');
		expect(flux.version).to.not.equal(undefined);
		expect(flux.version).to.equal('0.0.0');
	});
});
