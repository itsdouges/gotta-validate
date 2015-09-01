'use strict';

function required(name, val) {
	if (!val) {
		return;
	}

	if (!/(?=^.{8,}$)(?=.*\d)(?=.*[!@#$%^&*]+)(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/.test(val)) {
		return 'must be greater than or equal to 8 characters long, contain one or more uppercase, lowercase, numeric, and special characters';
	}
}

module.exports = required;