var Remotor = module.exports = function (out) {
	this.out = out;
};

Remotor.prototype = {
	callRemote: function (packet) {
		this.out(packet);
	}
};
