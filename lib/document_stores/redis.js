const redis = require('redis');
const winston = require('winston');

/**
 * For storing in redis
 * options[type] = redis
 * options[host] - The host to connect to (default localhost)
 * options[port] - The port to connect to (default 5379)
 * options[db] - The db to use (default 0)
 * options[expire] - The time to live for each key set (default never)
 */
class RedisDocumentStore {
  constructor(options, client) {
    this.expire = options.expire;
    if (client) {
      winston.info('using predefined redis client');
      RedisDocumentStore.client = client;
    } else if (!RedisDocumentStore.client) {
      winston.info('configuring redis');
      RedisDocumentStore.connect(options);
    }
  }

  /** Create a connection according to config */
  static connect(options) {
    const host = options.host || '127.0.0.1';
    const port = options.port || 6379;
    const index = options.db || 0;
    RedisDocumentStore.client = redis.createClient(port, host);
    // authenticate if password is provided
    if (options.password) {
      RedisDocumentStore.client.auth(options.password);
    }

    RedisDocumentStore.client.on('error', (err) => {
      winston.error('redis disconnected', err);
    });

    RedisDocumentStore.client.select(index, (err) => {
      if (err) {
        winston.error(
          'error connecting to redis index ' + index,
          { error: err }
        );
        process.exit(1);
      }
      else {
        winston.info('connected to redis on ' + host + ':' + port + '/' + index);
      }
    });
  }

  /** Save file in a key */
  set(key, data, callback, skipExpire) {
    RedisDocumentStore.client.set(key, data, (err) => {
      if (err) {
        callback(false);
      }
      else {
        if (!skipExpire) {
          this.setExpiration(key);
        }
        callback(true);
      }
    });
  }

  /** Expire a key in expire time if set */
  setExpiration(key) {
    if (this.expire) {
      RedisDocumentStore.client.expire(key, this.expire, (err) => {
        if (err) {
          winston.error('failed to set expiry on key: ' + key);
        }
      });
    }
  }

  /** Get a file from a key */
  get(key, callback, skipExpire) {
    RedisDocumentStore.client.get(key, (err, reply) => {
      if (!err && !skipExpire) {
        this.setExpiration(key);
      }
      callback(err ? false : reply);
    });
  }
}

module.exports = RedisDocumentStore;
