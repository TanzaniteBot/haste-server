// Draws inspiration from pwgen and http://tools.arantius.com/password

import { KeyGenerator } from '.';

const randOf = collection => {
	return () => {
		return collection[Math.floor(Math.random() * collection.length)];
	};
};

// Helper methods to get an random vowel or consonant
const randVowel = randOf('aeiou');
const randConsonant = randOf('bcdfghjklmnpqrstvwxyz');

export default class PhoneticKeyGenerator implements KeyGenerator {
	/**
	 * Generate a phonetic key of alternating consonant & vowel
	 */
	createKey(keyLength: number): string {
		let text = '';
		const start = Math.round(Math.random());

		for (let i = 0; i < keyLength; i++) {
			text += i % 2 == start ? randConsonant() : randVowel();
		}

		return text;
	}
}
