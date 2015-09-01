'use strict';

function required(name, val) {
	if (val === undefined) {
		return 'is required';
	}

	return;
}

module.exports = required;