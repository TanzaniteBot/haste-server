// @ts-check
import { equal, ok } from 'assert';
import Generator from '../../lib/key_generators/random';

describe('RandomKeyGenerator', () => {
	describe('generation', () => {
		it('should return a key of the proper length', () => {
			const gen = new Generator();
			equal(gen.createKey(6).length, 6);
		});

		it('should use a key from the given keyset if given', () => {
			const gen = new Generator({ keyspace: 'A' });
			equal(gen.createKey(6), 'AAAAAA');
		});

		it('should not use a key from the given keyset if not given', () => {
			const gen = new Generator({ keyspace: 'A' });
			ok(!gen.createKey(6).includes('B'));
		});
	});
});
