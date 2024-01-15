const fs = require('fs');
const crypto = require('crypto');

const winston = require('winston');

/**
 * For storing in files
 * options[type] = file
 * options[path] - Where to store
 */
class FileDocumentStore {
	constructor(options) {
		this.basePath = options.path || './data';
		this.expire = options.expire;
	}

	/** Generate md5 of a string */
	static md5(str) {
		const md5sum = crypto.createHash('md5');
		md5sum.update(str);
		return md5sum.digest('hex');
	}

	/**
	 * Save data in a file, key as md5 - since we don't know what we could
	 * be passed here
	 */
	set(key, data, callback, skipExpire) {
		try {
			fs.mkdir(this.basePath, '700', () => {
				const fn = this.basePath + '/' + FileDocumentStore.md5(key);
				fs.writeFile(fn, data, 'utf8', err => {
					if (err) {
						callback(false);
					} else {
						callback(true);
						if (this.expire && !skipExpire) {
							winston.warn('file store cannot set expirations on keys');
						}
					}
				});
			});
		} catch (err) {
			callback(false);
		}
	}

	/** Get data from a file from key */
	get(key, callback, skipExpire) {
		const fn = this.basePath + '/' + FileDocumentStore.md5(key);
		fs.readFile(fn, 'utf8', (err, data) => {
			if (err) {
				callback(false);
			} else {
				callback(data);
				if (this.expire && !skipExpire) {
					winston.warn('file store cannot set expirations on keys');
				}
			}
		});
	}
}

module.exports = FileDocumentStore;
