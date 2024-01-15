/*global require,module,process*/

var AWS = require('aws-sdk');
var winston = require('winston');

class AmazonS3DocumentStore {
  constructor(options) {
    this.expire = options.expire;
    this.bucket = options.bucket;
    this.client = new AWS.S3({ region: options.region });
  }

  get(key, callback, skipExpire) {
    var _this = this;

    var req = {
      Bucket: _this.bucket,
      Key: key
    };

    _this.client.getObject(req, function (err, data) {
      if (err) {
        callback(false);
      }
      else {
        callback(data.Body.toString('utf-8'));
        if (_this.expire && !skipExpire) {
          winston.warn('amazon s3 store cannot set expirations on keys');
        }
      }
    });
  }

  set(key, data, callback, skipExpire) {
    var _this = this;

    var req = {
      Bucket: _this.bucket,
      Key: key,
      Body: data,
      ContentType: 'text/plain'
    };

    _this.client.putObject(req, function (err, data) {
      if (err) {
        callback(false);
      }
      else {
        callback(true);
        if (_this.expire && !skipExpire) {
          winston.warn('amazon s3 store cannot set expirations on keys');
        }
      }
    });
  }
}

module.exports = AmazonS3DocumentStore;
