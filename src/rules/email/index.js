'use strict';

function noWhiteSpace(name, val) {
	if (!val) {
		return;
	}

	if (!/^\S+@\S+\.\S+$/.test(val)) {
		return 'needs to be a valid email, e.g. "email@valid.com"';
	}
}

module.exports = noWhiteSpace;