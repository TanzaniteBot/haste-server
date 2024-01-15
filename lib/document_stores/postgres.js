/*global require,module,process*/

const winston = require('winston');
const {Pool} = require('pg');

// create table entries (id serial primary key, key varchar(255) not null, value text not null, expiration int, unique(key));

/** A postgres document store */
class PostgresDocumentStore {
  constructor(options) {
    this.expireJS = parseInt(options.expire, 10);

    const connectionString = process.env.DATABASE_URL || options.connectionUrl;
    this.pool = new Pool({ connectionString });
  }

  /** Set a given key */
  set(key, data, callback, skipExpire) {
    const now = Math.floor(new Date().getTime() / 1000);
    this.safeConnect((err, client, done) => {
      if (err) { return callback(false); }
      client.query('INSERT INTO entries (key, value, expiration) VALUES ($1, $2, $3)', [
        key,
        data,
        this.expireJS && !skipExpire ? this.expireJS + now : null
      ], (err) => {
        if (err) {
          winston.error('error persisting value to postgres', { error: err });
          return callback(false);
        }
        callback(true);
        done();
      });
    });
  }

  /** Get a given key's data */
  get(key, callback, skipExpire) {
    const now = Math.floor(new Date().getTime() / 1000);
    this.safeConnect((err, client, done) => {
      if (err) { return callback(false); }
      client.query('SELECT id,value,expiration from entries where KEY = $1 and (expiration IS NULL or expiration > $2)', [key, now], (err, result) => {
        if (err) {
          winston.error('error retrieving value from postgres', { error: err });
          return callback(false);
        }
        callback(result.rows.length ? result.rows[0].value : false);
        if (result.rows.length && this.expireJS && !skipExpire) {
          client.query('UPDATE entries SET expiration = $1 WHERE ID = $2', [
            this.expireJS + now,
            result.rows[0].id
          ], (err) => {
            if (!err) {
              done();
            }
          });
        } else {
          done();
        }
      });
    });
  }

  /** A connection wrapper */
  safeConnect(callback) {
    this.pool.connect((error, client, done) => {
      if (error) {
        winston.error('error connecting to postgres', { error });
        callback(error);
      } else {
        callback(undefined, client, done);
      }
    });
  }
}

module.exports = PostgresDocumentStore;
