'use strict';

var q = require('q');

var GottaValidate;

describe('resource validator', function () {
	beforeEach(function () {
		GottaValidate = require('./index');
	});

	describe('instantiation', function () {
		it('should throw error if resource is not defined', function () {
			expect(function () {
				GottaValidate({
					resource: 'not-defined',
					mode: 'not-defined'
				});
			}).toThrow(Error('Resource is not defined, add one via. GottaValidate.addResource({}) before trying to instantiate!'));
		});

		it('should throw error if mode is not defined', function () {
			expect(function () {
				GottaValidate.addRule({
					name: 'defined',
					func: function () {}
				});

				GottaValidate.addResource({
					name: 'name',
					mode: 'create',
					rules: {
						propertyName: 'defined',
						anotherProperty: ['defined']
					}
				});

				GottaValidate({
					resource: 'name',
					mode: 'not-defined'
				});
			}).toThrow(Error('Resource mode is not defined, add one via. GottaValidate.addResource({}) before trying to instantiate!'));
		});
	});

	describe('adding rule', function () {
		it('should throw error if no object is passed in', function () {
			expect(function () {
				GottaValidate.addRule();
			}).toThrow(Error('Pass a rule object in!'));
		});

		it('should throw error if name isnt defined', function () {
			expect(function () {
				GottaValidate.addRule({});
			}).toThrow(Error('Name must be a string!'));
		});

		it('should throw error if rule isnt a function', function () {
			expect(function () {
				GottaValidate.addRule({
					name: 'ayylmao'
				});

			}).toThrow(Error('Rule must be a function!'));
		});

		it('should throw error when inheriting with string if rule not found', function () {
			expect(function () {
				GottaValidate.addRule({
					name: 'cool-rule',
					func: function () {},
					inherits: 'ayyy'
				});

			}).toThrow(Error('Rule [ayyy] not found, add it before trying to inherit'));
		});

		it('should throw error when inheriting with array if rule not found', function () {
			expect(function () {
				GottaValidate.addRule({
					name: 'cool-rule',
					func: function () {},
					inherits: ['ayyy']
				});

			}).toThrow(Error(['Rule [ayyy] not found, add it before trying to inherit']));
		});
	});

	describe('adding resource', function () {
		it('should throw three errors on empty object', function () {
			expect(function () {
				GottaValidate.addResource({});
			}).toThrow(Error(
				[
					'Name not defined', 
					'Mode not defined',
					'Rules not defined'
				]));
		});

		it('should throw error if rules isnt an object', function () {
			expect(function () {
				GottaValidate.addResource({
					name: 'name',
					mode: 'create',
					rules: 'not an object'
				});
			}).toThrow(Error('Rules has to be an object!'));
		});

		it('should throw error if any of the rules are an object', function () {
			expect(function () {
				GottaValidate.addResource({
					name: 'name',
					mode: 'create',
					rules: {
						propertyName: {},
						anotherProperty: [{}]
					}
				});
			})
			.toThrow(Error([
				'Rule for property [propertyName] can only be strings! Try a string or array of strings!',
				'Rule in array for property [anotherProperty] can only be strings! Try a string or array of strings!',
			]));
		});

		it('should throw error if any of the rules are arent defined', function () {
			expect(function () {
				GottaValidate.addResource({
					name: 'name',
					mode: 'create',
					rules: {
						propertyName: 'not defined',
						anotherProperty: ['not-defined']
					}
				});
			})
			.toThrow(Error([
				'Rule "not defined" for property [propertyName] is not defined. Add it before adding a resource!',
				'Rule "not-defined" in array for property [anotherProperty] is not defined. Add it before adding a resource!',
			]));
		});

		it('should add successfully', function () {
			expect(function () {
				GottaValidate.addRule({
					name: 'defined',
					func: function () {}
				})
				.addRule({
					name: 'swag',
					func: function () {}
				});

				GottaValidate.addResource({
					name: 'name',
					mode: 'create',
					rules: {
						propertyName: 'defined',
						anotherProperty: ['swag']
					}
				})
				.addResource({
					name: 'another-resource',
					mode: 'update',
					rules: {
						propertyName: 'swag',
						anotherProperty: ['defined']
					}
				});
			}).not.toThrow();
		});
	});

	describe('runner', function () {
		var systemUnderTest;
		var promiseRuleDefer;

		GottaValidate = require('./index');

		beforeEach(function () {
			GottaValidate.addRule({
				name: 'required-synchronous',
				func: function (name, object) {
					if(!object[name]) {
						return 'is required';
					}
				}
			});

			GottaValidate.addRule({
				name: 'promise-with-dependency',
				func: function (name, object, dependencies) {
					expect(dependencies.a).toBeDefined();
					expect(dependencies.a.hey).toBe('im defined');

					promiseRuleDefer = q.defer();
					return promiseRuleDefer.promise;
				},
				dependencies: {
					a: {
						hey: 'im defined'
					}
				}
			});

			GottaValidate.addResource({
				name: 'user',
				mode: 'create',
				rules: {
					email: 'required-synchronous',
					uniqueEmail: 'promise-with-dependency'
				}
			});

			GottaValidate.addResource({
				name: 'user',
				mode: 'update',
				rules: {
					email: ['required-synchronous', 'promise-with-dependency']
				}
			});
		});

		it ('should throw error if object isnt passed in', function () {
			systemUnderTest = GottaValidate({
				resource: 'user',
				mode: 'create'
			});

			expect(function () {
				systemUnderTest.validate();
			}).toThrow(Error('Only objects can be validated.'));
		});

		it ('should throw if resolved error object isnt as expected', function (done) {
			done();

			systemUnderTest = GottaValidate({
				resource: 'user',
				mode: 'update'
			});

			systemUnderTest.validate({
				email: 'cool@email.com'
			})
			.then(null, function () {throw 'h';})
			.done();

			promiseRuleDefer.resolve('ahhhh');
		});

		describe('with string', function () {		
			it ('should resolve promise with error email is required', function (done) {
				systemUnderTest = GottaValidate({
					resource: 'user',
					mode: 'create'
				});

				systemUnderTest.validate({})
				.then(null, function (e) {
					expect(e).toEqual([
						'[email] is required'
					]);

					done();
				});

				promiseRuleDefer.resolve();
			});

			it ('should resolve promise', function (done) {
				systemUnderTest = GottaValidate({
					resource: 'user',
					mode: 'create'
				});

				systemUnderTest.validate({
					email: 'email@email.com'
				})
				.then(function (e) {
					done();
				});

				promiseRuleDefer.resolve();
			});

			it ('should reject promise with unique email is required error', function (done) {
				systemUnderTest = GottaValidate({
					resource: 'user',
					mode: 'create'
				});

				systemUnderTest.validate({
					email: 'im here',
					uniqueEmail: 'cool@email.com'
				})
				.then(null, function (e) {
					expect(e).toEqual([
						'[uniqueEmail] is taken'
					]);

					done();
				});

				promiseRuleDefer.resolve({
					message: 'is taken',
					property: 'uniqueEmail'
				});
			});

			it ('should reject promise with required and unique error', function (done) {
				systemUnderTest = GottaValidate({
					resource: 'user',
					mode: 'create'
				});

				systemUnderTest.validate({
					uniqueEmail: 'cool@email.com'
				})
				.then(null, function (e) {
					expect(e).toEqual([
						'[email] is required',
						'[uniqueEmail] is taken'
					]);
					
					done();
				});

				promiseRuleDefer.resolve({
					message: 'is taken',
					property: 'uniqueEmail'
				});
			});

			it ('should call inherited rules', function () {
				var inheritPromiseRuleDefer;

				GottaValidate.addRule({
					name: 'sync-rule',
					func: function () {
						return 'ayy sync';
					}
				});

				GottaValidate.addRule({
					name: 'promise-rule-with-inheritance',
					func: function (name, object) {
						inheritPromiseRuleDefer = q.defer();
						return inheritPromiseRuleDefer.promise;
					},
					inherits: 'sync-rule'
				});

				GottaValidate.addResource({
					name: 'cool',
					mode: 'cooler',
					rules: {
						prop1: 'promise-rule-with-inheritance'
					}
				});

				systemUnderTest = GottaValidate({
					resource: 'cool',
					mode: 'cooler'
				});

				systemUnderTest.validate({
					prop1: 'lol'
				})
				.then(null, function (e) {
					expect(e).toEqual([
						'[prop1] ayy sync',
						'[prop1] is cool'
					]);
				});

				inheritPromiseRuleDefer.resolve({
					message: 'is cool',
					property: 'prop1'
				});
			});

			it ('should throw if inherited rule doesnt exist', function () {
				expect(function () {
					GottaValidate.addRule({
						name: 'promise-rule-with-inheritance',
						func: function (name, object) {
							inheritPromiseRuleDefer = q.defer();
							return inheritPromiseRuleDefer.promise;
						},
						inherits: 'no-exist'
					});
				}).toThrow(Error('Rule [no-exist] not found, add it before trying to inherit'));
			});
		});

		describe('with array', function () {
			it ('should reject promise with unique error', function (done) {
				systemUnderTest = GottaValidate({
					resource: 'user',
					mode: 'update'
				});

				systemUnderTest.validate({
					email: 'cool@email.com'
				})
				.then(null, function (e) {
					expect(e).toEqual([
						'[email] is taken'
					]);
					
					done();
				});

				promiseRuleDefer.resolve({
					message: 'is taken',
					property: 'email'
				});
			});

			it ('should reject promise with required error', function (done) {
				systemUnderTest = GottaValidate({
					resource: 'user',
					mode: 'update'
				});

				systemUnderTest.validate({})
				.then(null, function (e) {
					expect(e).toEqual([
						'[email] is required'
					]);
					
					done();
				});

				promiseRuleDefer.resolve();
			});

			it ('should call inherited rules', function () {
				var inheritPromiseRuleDefer;

				GottaValidate.addRule({
					name: 'sync-rule',
					func: function () {
						return 'ayy sync';
					}
				});

				GottaValidate.addRule({
					name: 'promise-rule-with-inheritance',
					func: function (name, object) {
						inheritPromiseRuleDefer = q.defer();
						return inheritPromiseRuleDefer.promise;
					},
					inherits: ['sync-rule']
				});

				GottaValidate.addResource({
					name: 'cool',
					mode: 'cooler',
					rules: {
						prop1: 'promise-rule-with-inheritance'
					}
				});

				systemUnderTest = GottaValidate({
					resource: 'cool',
					mode: 'cooler'
				});

				systemUnderTest.validate({
					prop1: 'lol'
				})
				.then(null, function (e) {
					expect(e).toEqual([
						'[prop1] ayy sync',
						'[prop1] is cool'
					]);
				});

				inheritPromiseRuleDefer.resolve({
					message: 'is cool',
					property: 'prop1'
				});
			});

			it ('should throw if inherited rule doesnt exist', function () {
				expect(function () {
					GottaValidate.addRule({
						name: 'promise-rule-with-inheritance',
						func: function (name, object) {
							inheritPromiseRuleDefer = q.defer();
							return inheritPromiseRuleDefer.promise;
						},
						inherits: ['no-exist']
					});
				}).toThrow(Error(['Rule [no-exist] not found, add it before trying to inherit']));
			});
		});
	});

	describe('pre defined rules', function () {
		it('should have required', function () {
			GottaValidate.addDefaultRules();

			GottaValidate.addResource({
				name: 'resource',
				mode: 'mode',
				rules: {
					property: 'required'
				}
			});
		});

		it('should have noWhiteSpace', function () {
			GottaValidate.addDefaultRules();

			GottaValidate.addResource({
				name: 'resource',
				mode: 'mode',
				rules: {
					property: 'no-white-space'
				}
			});
		});

		it('should have password', function () {
			GottaValidate.addDefaultRules();

			GottaValidate.addResource({
				name: 'resource',
				mode: 'mode',
				rules: {
					property: 'password'
				}
			});
		});

		it('should have email', function () {
			GottaValidate.addDefaultRules();
			
			GottaValidate.addResource({
				name: 'resource',
				mode: 'mode',
				rules: {
					property: 'email'
				}
			});
		});
	});
});