var _ = require('underscore')
	, ids = 0;

var Node = module.exports = function (pipe, name, classes) {
	var args = Array.prototype.slice.call(arguments);
	this.id = ids++;
	this.pipe = pipe;
	this.name = name;
	this.classes = _.rest(args, 2);
};

Node.prototype = {
	send: function (data, callback, retry) {
		var self = this;
		retry = retry || 0;
		try {
			if (self.pipe && 
					self.pipe.canSend()) {
				self.pipe.remoteCall(data, callback);
			}
			else {
				if (callback)
					callback(null, false);
			}
		}
		catch (e) {
			if (callback)
				callback(e, false);
		}
	}
};
