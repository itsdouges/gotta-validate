function setDefaults(GottaValidate) {
	GottaValidate.addRule({
		name: 'required',
		func: require('./rules/required')
	});

	GottaValidate.addRule({
		name: 'no-white-space',
		func: require('./rules/no-white-space')
	});

	GottaValidate.addRule({
		name: 'email',
		func: require('./rules/email')
	});

	GottaValidate.addRule({
		name: 'password',
		func: require('./rules/strong-password')
	});
}

module.exports = setDefaults;