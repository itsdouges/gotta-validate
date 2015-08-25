describe('examples', function () {
	var GottaValidate;

	beforeEach(function () {
		GottaValidate = require('./index');
	});

	describe('general', function () {
		beforeEach(function () {
			GottaValidate.addRule({
			    name: 'required',
			    func: function (property, object) {
			        var item = object[property];
			        if (!item) {
			            return 'is required!';
			        }
			    }
			});

			GottaValidate.addResource({
				name: 'users',
				mode: 'create',
				rules: {
					id: 'required',
					email: ['required']
				}
			});
		});

		it('should reject with two errors', function (done) {
			var validator = GottaValidate({
			  resource: 'users',
			  mode: 'create'
			});

			var my_object = {};

			validator
			    .validate(my_object)
			    .then(null, function (e) {
			        expect(e).toEqual([
								'[id] is required!', 
								'[email] is required!' 
			        ]);

			        done();
			    });
		});

		it('should resolve', function (done) {
			var validator = GottaValidate({
			  resource: 'users',
			  mode: 'create'
			});

			var my_object = {
				id: 'ayylmao',
				email: 'coolemailthough'
			};

			validator
			    .validate(my_object)
			    .then(function (e) {
			    	expect(e).not.toBeDefined();
			    	done();
			    });
		});
	});

	describe('extras', function () {
		it('should inherit', function (done) {
			GottaValidate.addRule({
				name: 'rule-a',
				func: function () {
					return 'bad';
				}
			});

			GottaValidate.addRule({
				name: 'rule-b',
				func: function () {
					return 'naughty!';
				},
				inherits: 'rule-a'
			});

			GottaValidate.addResource({
				name: 'inherit',
				mode: 'deez',
				rules: {
					id: ['rule-b']
				}
			});

			var validator = GottaValidate({
			  resource: 'inherit',
			  mode: 'deez'
			});

			validator
		    .validate({})
		    .then(null, function (e) {
		    	expect(e).toEqual([
	    			'[id] bad',
	    			'[id] naughty!'
	    		]);

		    	done();
		    });
		});

		it('should resolve dependency', function () {
			GottaValidate.addRule({
			    name: 'depender',
			    func: function (property, object, dependencies) {
			        var error = dependencies.a();
			        if (error) {
			            return 'oh no error!';
			        }
			    },
			    dependencies: {
			        a: function () { return true; }
			    }
			});

			GottaValidate.addResource({
				name: 'dependy',
				mode: 'yeah',
				rules: {
					id: 'depender'
				}
			});

			var validator = GottaValidate({
			  resource: 'dependy',
			  mode: 'yeah'
			});

			var my_object = {
				id: 'ayylmao'
			};

			validator
			    .validate(my_object)
			    .then(null, function (e) {
			    	expect(e).toEqual([
		    			'[id] oh no error!'
		    		]);

			    	done();
			    });
		});
	});
});