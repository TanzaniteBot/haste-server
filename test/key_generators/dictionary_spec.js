// @ts-check

import { equal, throws } from 'assert';
import { writeFileSync } from 'fs';
import Generator from '../../lib/key_generators/dictionary';

describe('DictionaryGenerator', () => {
	describe('options', () => {
		it('should throw an error if given no options', () => {
			throws(() => {
				new Generator();
			}, Error);
		});

		it('should throw an error if given no path', () => {
			throws(() => {
				new Generator({});
			}, Error);
		});
	});
	describe('generation', function () {
		it('should return a key of the proper number of words from the given dictionary', () => {
			const path = '/tmp/haste-server-test-dictionary';
			const words = ['cat'];
			writeFileSync(path, words.join('\n'));

			const gen = new Generator({ path }, () => {
				equal('catcatcat', gen.createKey(3));
			});
		});
	});
});
