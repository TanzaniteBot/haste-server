// @ts-check

import Busboy from 'busboy';
import { error as _error, verbose, warn } from 'winston';
import { Store } from './document_stores';

/**
 * For handling serving stored documents
 */
export default class DocumentHandler {
	static defaultKeyLength = 10;

	keyLength: number;
	maxLength?: number;
	store?: Store;
	keyGenerator;

	/**
	 * @param {{ keyLength?: number; maxLength?: number; store?: Store; keyGenerator?: any; }} options
	 */
	constructor(options: { keyLength?: number; maxLength?: number; store?: Store; keyGenerator?: any } = {}) {
		this.keyLength = options.keyLength || DocumentHandler.defaultKeyLength;
		this.maxLength = options.maxLength; // none by default
		this.store = options.store;
		this.keyGenerator = options.keyGenerator;
	}

	/**
	 * Handle retrieving a document
	 */
	handleGet(request, response, config) {
		const key = request.params.id.split('.')[0];
		const skipExpire = !!config.documents[key];


		
		this.store!.get(
			key,
			ret => {
				if (ret) {
					verbose('retrieved document', { key: key });
					response.writeHead(200, { 'content-type': 'application/json' });
					if (request.method === 'HEAD') {
						response.end();
					} else {
						response.end(JSON.stringify({ data: ret, key: key }));
					}
				} else {
					warn('document not found', { key: key });
					response.writeHead(404, { 'content-type': 'application/json' });
					if (request.method === 'HEAD') {
						response.end();
					} else {
						response.end(JSON.stringify({ message: 'Document not found.' }));
					}
				}
			},
			skipExpire
		);
	}

	/**
	 * Handle retrieving the raw version of a document
	 */
	handleRawGet(request, response, config) {
		const key = request.params.id.split('.')[0];
		const skipExpire = !!config.documents[key];

		this.store.get(
			key,
			ret => {
				if (ret) {
					verbose('retrieved raw document', { key: key });
					response.writeHead(200, { 'content-type': 'text/plain; charset=UTF-8' });
					if (request.method === 'HEAD') {
						response.end();
					} else {
						response.end(ret);
					}
				} else {
					warn('raw document not found', { key: key });
					response.writeHead(404, { 'content-type': 'application/json' });
					if (request.method === 'HEAD') {
						response.end();
					} else {
						response.end(JSON.stringify({ message: 'Document not found.' }));
					}
				}
			},
			skipExpire
		);
	}

	/**
	 * Handle adding a new Document
	 */
	handlePost(request, response) {
		var buffer = '';
		var cancelled = false;

		// What to do when done
		var onSuccess = () => {
			// Check length
			if (this.maxLength && buffer.length > this.maxLength) {
				cancelled = true;
				warn('document >maxLength', { maxLength: this.maxLength });
				response.writeHead(400, { 'content-type': 'application/json' });
				response.end(JSON.stringify({ message: 'Document exceeds maximum length.' }));
				return;
			}
			// And then save if we should
			this.chooseKey(key => {
				this.store.set(key, buffer, res => {
					if (res) {
						verbose('added document', { key: key });
						response.writeHead(200, { 'content-type': 'application/json' });
						response.end(JSON.stringify({ key: key }));
					} else {
						verbose('error adding document');
						response.writeHead(500, { 'content-type': 'application/json' });
						response.end(JSON.stringify({ message: 'Error adding document.' }));
					}
				});
			});
		};

		// If we should, parse a form to grab the data
		var ct = request.headers['content-type'];
		if (ct && ct.split(';')[0] === 'multipart/form-data') {
			// @ts-ignore
			var busboy = new Busboy({ headers: request.headers });
			busboy.on('field', (fieldname, val) => {
				if (fieldname === 'data') {
					buffer = val;
				}
			});
			busboy.on('finish', () => {
				onSuccess();
			});
			request.pipe(busboy);
			// Otherwise, use our own and just grab flat data from POST body
		} else {
			request.on('data', data => {
				buffer += data.toString();
			});
			request.on('end', () => {
				if (cancelled) {
					return;
				}
				onSuccess();
			});
			request.on('error', error => {
				_error('connection error: ' + error.message);
				response.writeHead(500, { 'content-type': 'application/json' });
				response.end(JSON.stringify({ message: 'Connection error.' }));
				cancelled = true;
			});
		}
	}

	/**
	 * Keep choosing keys until one isn't taken
	 */
	chooseKey(callback) {
		var key = this.acceptableKey();
		this.store.get(
			key,
			ret => {
				if (ret) {
					this.chooseKey(callback);
				} else {
					callback(key);
				}
			},
			true
		); // Don't bump expirations when key searching
	}

	acceptableKey() {
		return this.keyGenerator.createKey(this.keyLength);
	}
}
