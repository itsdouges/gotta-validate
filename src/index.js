'use strict';

var q = require('q');

var resources = {};
var rules = {};

function GottaValidate (options) {
	if (!resources[options.resource]) {
		throw Error('Resource is not defined, add one via. GottaValidate.addResource({}) before trying to instantiate!');
	}

	if (!resources[options.resource][options.mode]) {
		throw Error('Resource mode is not defined, add one via. GottaValidate.addResource({}) before trying to instantiate!');
	}

	var validate = function (object) {
		if (typeof object !== 'object') {
			throw Error('Only objects can be validated.');
		}
		
		function callValidator(propertyName, object, validator) {
			if (validator.inherits) {
				if (Array.isArray(validator.inherits)) {
					validator.inherits.forEach(function (ruleName) {
						callValidator(propertyName, object, rules[ruleName]);
					});
				} else {
					callValidator(propertyName, object, rules[validator.inherits]);
				}
			}

			var result = validator.func(property, object, validator.dependencies);
			if (result !== undefined) {
				if (result.toString && result.toString() === '[object Promise]') {
					result.then(function (err) {
						if (err) {
							var errs = [];
							if (!err.property) {
								errs.push('[property] is expected on the resolved promise object');
							}

							if (!err.message) {
								errs.push('[message] is expected on the resolved promise object');
							}

							if (errs.length) {
								throw Error(errs);
							}

							errors.push('[' + err.property + '] ' + err.message);
						}
					});

					validationPromises.push(result);
				} else {
					errors.push('[' + property + '] ' + result);
					validationPromises.push(q.resolve());
				}
			}
		}

		var defer = q.defer();
		var validationPromises = [];
		var errors = [];

		var resource = resources[options.resource][options.mode];
		for (var property in resource.rules) {
			if (!resource.rules.hasOwnProperty(property)) {
				continue;
			}

			var propertyRules = resource.rules[property];
			if (Array.isArray(propertyRules)) {
				propertyRules.forEach(function (ruleName) {
					var validator = rules[ruleName];
					callValidator(property, object, validator);
				});
			} else {
				var ruleName = propertyRules;
				var validator = rules[ruleName];

				callValidator(property, object, validator);
			}
		}

		q.all(validationPromises)
			.then(function () {
				errors.length ? 
					defer.reject(errors) : 
					defer.resolve();
			});

		return defer.promise;
	};

	return {
		validate: validate
	};
};

GottaValidate.addRule = function (rule) {
	if (typeof rule !== 'object') {
		throw Error('Pass a rule object in!');
	}

	if (typeof rule.name !== 'string') {
		throw Error('Name must be a string!')
	}

	if (typeof rule.func !== 'function') {
		throw Error('Rule must be a function!');
	}

	if (rule.inherits) {
		if (Array.isArray(rule.inherits)) {
			var errors = [];

			rule.inherits.forEach(function (e) {
				if (!rules[e]) {
					errors.push('Rule [' + e + '] not found, add it before trying to inherit');
				}
			});

			if (errors.length) {
				throw Error(errors);
			}
		} else {
			if (!rules[rule.inherits]) {
				throw Error('Rule [' + rule.inherits + '] not found, add it before trying to inherit');
			}
		}
	}

	rules[rule.name] = rule;

	return this;
};

GottaValidate.addResource = function (resource) {
	var errors = [];

	// todo: add array capability to name so we can
	// have alias'? such as create is the same as update

	function validateRule(property, rule, isArray) {
		var arrayText = isArray ? ' in array' : '';

		if (Array.isArray(rule)) {
			rule.forEach(function (r) {
				validateRule(property, r, true);
			});
		} else if (typeof rule !== 'string') {
			errors.push('Rule'+ arrayText + ' for property [' + property + '] can only be strings! Try a string or array of strings!');
		} else if (!rules[rule]) {
			errors.push('Rule "' + rule + '"' + arrayText + ' for property [' + property + '] is not defined. Add it before adding a resource!');
		}
	}

	if (!resource.name) {
		errors.push('Name not defined');
	}

	if (!resource.mode) {
		errors.push('Mode not defined');
	}

	if (!resource.rules) {
		errors.push('Rules not defined');
	} else if (typeof resource.rules !== 'object') {
		errors.push('Rules has to be an object!');
	} else {
		for (var property in resource.rules) {
			if (!resource.rules.hasOwnProperty(property)) {
				continue;
			}

			validateRule(property, resource.rules[property]);
		}
	}

	if (errors.length) {
		throw Error(errors);
	}

	if (!resources[resource.name]) {
		resources[resource.name] = {};
	}

	resources[resource.name][resource.mode] = resource;

	return this;
};

GottaValidate.addDefaultRules = function () {
	require('./add-default-rules')(GottaValidate);
};

module.exports = GottaValidate;