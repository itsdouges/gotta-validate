'use strict';

// todo:
// 1. add complex object validation support

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

		var defer = q.defer();
		var validationPromises = [];
		var errors = [];
		var resource = resources[options.resource][options.mode];
		
		function traversePropertyRules(propertyName, ob, validator) {
			if (validator.inherits) {
				if (Array.isArray(validator.inherits)) {
					validator.inherits.forEach(function (ruleName) {
						traversePropertyRules(propertyName, ob, rules[ruleName]);
					});
				} else {
					traversePropertyRules(propertyName, ob, rules[validator.inherits]);
				}
			}

			var propVal = ob ? ob[propertyName] : undefined;

			if (Array.isArray(propVal)) {
				propVal.forEach(function (i) {
					callValidator(propertyName, i, validator);
				});
			} else {
				callValidator(propertyName, propVal, validator);
			}

			function callValidator(prop, value, validtr) {
				var result = validtr.func(prop, value, validtr.dependencies);
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
						errors.push('[' + prop + '] ' + result);
						validationPromises.push(q.resolve());
					}
				}
			}
		}

		function traverseRulesObject(rulesObject, obj) {
			for (var property in rulesObject) {
				if (!rulesObject.hasOwnProperty(property)) {
					continue;
				}

				var propertyValue = rulesObject[property];
				if (Array.isArray(propertyValue)) {
					// traverse the array, we've found multiple rules!
					propertyValue.forEach(function (ruleName) {
						var validator = rules[ruleName];
						traversePropertyRules(property, obj, validator);
					});
				}
				else if (typeof propertyValue === 'object') {
					// traverse the object, its more another rule object!
					traverseRulesObject(propertyValue, obj[property] || undefined);
				} else {
					// we've found a single rule!
					var ruleName = propertyValue;
					var validator = rules[ruleName];

					traversePropertyRules(property, obj, validator);
				}
			}
		}

		traverseRulesObject(resource.rules, object);

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

	function validateRule(property, rule) {
		if (Array.isArray(rule)) {
			// traverse array validating rules
			rule.forEach(function (r) {
				validateRule(property, r);
			});
		} else if (typeof rule === 'object') {
			// traverse object validating rules
			for(var childProperty in rule) {
				if (rule.hasOwnProperty(childProperty)) {
					validateRule(childProperty, rule[childProperty]);
				}
			}
		}	else if (!rules[rule]) {
			errors.push('Rule "' + rule + '"' + ' for property [' + property + '] is not defined. Add it before adding a resource!');
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