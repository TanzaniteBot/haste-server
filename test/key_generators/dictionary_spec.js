import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { writeFileSync } from 'node:fs';
import Generator from '../../lib/key_generators/dictionary.js';

describe('DictionaryGenerator', () => {
	describe('options', () => {
		it('should throw an error if given no options', () => {
			assert.throws(() => {
				new Generator();
			}, Error);
		});

		it('should throw an error if given no path', () => {
			assert.throws(() => {
				new Generator({});
			}, Error);
		});
	});
	describe('generation', () => {
		it('should return a key of the proper number of words from the given dictionary', () => {
			const path = '/tmp/haste-server-test-dictionary';
			const words = ['cat'];
			writeFileSync(path, words.join('\n'));

			const gen = new Generator({ path }, () => {
				assert.equal('catcatcat', gen.createKey(3));
			});
		});
	});
});
