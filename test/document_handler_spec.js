// @ts-check

import { equal } from 'assert';
import DocumentHandler from '../lib/document_handler';
import Generator from '../lib/key_generators/random';

describe('document_handler', function () {
	describe('randomKey', function () {
		it('should choose a key of the proper length', () => {
			const gen = new Generator();
			const dh = new DocumentHandler({ keyLength: 6, keyGenerator: gen });
			equal(6, dh.acceptableKey().length);
		});

		it('should choose a default key length', () => {
			const gen = new Generator();
			const dh = new DocumentHandler({ keyGenerator: gen });
			equal(dh.keyLength, DocumentHandler.defaultKeyLength);
		});
	});
});
