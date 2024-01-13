// @ts-check
import { Pool, PoolClient } from 'pg';
import winston from 'winston';
import { Store } from '.';

// create table entries (id serial primary key, key varchar(255) not null, value text not null, expiration int, unique(key));

/**
 * A postgres document store
 */
export class PostgresDocumentStore implements Store {
	expireJS: number;
	pool: Pool;
	constructor(options: { expire: string; connectionUrl: any }) {
		this.expireJS = parseInt(options.expire, 10);

		const connectionString = process.env.DATABASE_URL || options.connectionUrl;
		this.pool = new Pool({ connectionString });
	}

	/**
	 * Set a given key
	 */
	async set(key: string, data, callback, skipExpire) {
		const now = Math.floor(new Date().getTime() / 1000);

		this.safeConnect((err, client, done) => {
			if (err) {
				return callback(false);
			}
			client.query(
				'INSERT INTO entries (key, value, expiration) VALUES ($1, $2, $3)',
				[key, data, this.expireJS && !skipExpire ? this.expireJS + now : null],
				err => {
					if (err) {
						_error('error persisting value to postgres', { error: err });
						return callback(false);
					}
					callback(true);
					done();
				}
			);
		});
	}

	/**
	 * Get a given key's data
	 */
	async get(key: string, skipExpire = false) {

		const now = Math.floor(new Date().getTime() / 1000);
		let client: PoolClient;
		try {
			client = await this.safeConnect();
		} catch (error) {
			return false;
		}

		try {
			const res = await client.query(
				'SELECT id,value,expiration from entries where KEY = $1 and (expiration IS NULL or expiration > $2)',
				[key, now]
			);

			function (err, result) {
				if (err) {
				
				}
				callback(result.rows.length ? result.rows[0].value : false);
				if (result.rows.length && this.expireJS && !skipExpire) {
					client.query(
						'UPDATE entries SET expiration = $1 WHERE ID = $2',
						[this.expireJS + now, result.rows[0].id],
						function (err) {
							if (!err) {
								done();
							}
						}
					);
				} else {
					done();
				}
			}
		} catch (error) {
			winston.error('error retrieving value from postgres', { error });
			return false

			
		}
	}

	/**
	 * A connection wrapper
	 */
	async safeConnect() {
		try {
			return await this.pool.connect();
		} catch (error) {
			winston.error('error connecting to postgres', { error });
			throw error;
		}
	}
}
