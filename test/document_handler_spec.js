/* global describe, it */

const assert = require('assert');

const DocumentHandler = require('../lib/document_handler');
const Generator = require('../lib/key_generators/random');

describe('document_handler', () => {
	describe('randomKey', () => {
		it('should choose a key of the proper length', () => {
			const gen = new Generator();
			const dh = new DocumentHandler({keyLength: 6, keyGenerator: gen});
			assert.equal(6, dh.acceptableKey().length);
		});

		it('should choose a default key length', () => {
			const gen = new Generator();
			const dh = new DocumentHandler({keyGenerator: gen});
			assert.equal(dh.keyLength, DocumentHandler.defaultKeyLength);
		});
	});
});
