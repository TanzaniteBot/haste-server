import { MongoClient } from 'mongodb';
import winston from 'winston';

export default class MongoDocumentStore {
	constructor(options) {
		this.expire = options.expire;
		this.connectionUrl = process.env.DATABASE_URl || options.connectionUrl;
	}

	set(key, data, callback, skipExpire) {
		const now = Math.floor(new Date().getTime() / 1000);

		this.safeConnect((err, db) => {
			if (err) return callback(false);

			db.collection('entries').update(
				{
					entry_id: key,
					$or: [{ expiration: -1 }, { expiration: { $gt: now } }],
				},
				{
					entry_id: key,
					value: data,
					expiration: this.expire && !skipExpire ? this.expire + now : -1,
				},
				{
					upsert: true,
				},
				(err, existing) => {
					if (err) {
						winston.error('error persisting value to mongodb', { error: err });
						return callback(false);
					}

					callback(true);
				}
			);
		});
	}

	get(key, callback, skipExpire) {
		const now = Math.floor(new Date().getTime() / 1000);

		this.safeConnect((err, db) => {
			if (err) return callback(false);

			db.collection('entries').findOne(
				{
					entry_id: key,
					$or: [{ expiration: -1 }, { expiration: { $gt: now } }],
				},
				(err, entry) => {
					if (err) {
						winston.error('error persisting value to mongodb', { error: err });
						return callback(false);
					}

					callback(entry === null ? false : entry.value);

					if (entry !== null && entry.expiration !== -1 && this.expire && !skipExpire) {
						db.collection('entries').update(
							{
								entry_id: key,
							},
							{
								$set: {
									expiration: this.expire + now,
								},
							},
							(err, result) => {}
						);
					}
				}
			);
		});
	}

	safeConnect(callback) {
		MongoClient.connect(this.connectionUrl, (err, db) => {
			if (err) {
				winston.error('error connecting to mongodb', { error: err });
				callback(err);
			} else {
				callback(undefined, db);
			}
		});
	}
}
