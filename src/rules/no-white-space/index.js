'use strict';

function noWhiteSpace(name, val) {
	if (!val) {
		return;
	}

	if (/\s/g.test(val)) {
		return 'is not allowed to have spaces';
	}
}

module.exports = noWhiteSpace;