var _ = require('underscore')

var Map = module.exports = function (elements, getName, getClasses) {
	var self = this;
	if (_.isFunction(elements))
		self.getElements = elements;
	else
		self.getElements = function () { return elements; }
	self.getName = getName || function (el) { return el.name; };
	self.getClasses = getClasses || function (el) { return el.classes; };
	self.compareName = function (name) {
		return function (el) {
			return self.getName(el) === name;
		}
	};
	self.compareClasses = function (classes) {
		return function (el) {
			return _.all(classes, function (cls) { return _.contains(self.getClasses(el), cls); });
		}
	};
};

Map.prototype = {
	resolve: function (selector) {
		if (!selector || selector === '') return [];
		var nameCap = /^(\w*)/.exec(selector)
			, classCap = /\.(\w+)\.?(\w*)\.?(\w*)\.?(\w*)\.?(\w*)/g.exec(selector)
		var name, classes = [];
		if (nameCap)
			name = nameCap[1];
		if (classCap) 
			classes = _.compact(_.rest(classCap));
		if (name) {
			return _.pluck(_.filter(this.getElements(), this.compareName(name)), 'node');
		}
		else if (classes && classes.length) {
			return _.pluck(_.filter(this.getElements(), this.compareClasses(classes)), 'node');
		}
		return [];
	}
};
