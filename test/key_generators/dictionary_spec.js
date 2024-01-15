const { describe, it } = require('node:test');
const assert = require('assert');
const fs = require('fs');
const Generator = require('../../lib/key_generators/dictionary');

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
			fs.writeFileSync(path, words.join('\n'));

			const gen = new Generator({ path }, () => {
				assert.equal('catcatcat', gen.createKey(3));
			});
		});
	});
});
