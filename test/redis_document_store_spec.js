// @ts-check

import { equal, ok } from 'assert';

import { remove, transports } from 'winston';
remove(transports.Console);

import RedisDocumentStore, { client } from '../lib/document_stores/redis';

describe('redis_document_store', () => {
	/* reconnect to redis on each test */
	afterEach(() => {
		if (client) {
			client.quit();
			client = false;
		}
	});

	describe('set', function () {
		it('should be able to set a key and have an expiration set', done => {
			const store = new RedisDocumentStore({ expire: 10 });
			store.set('hello1', 'world', function () {
				client.ttl('hello1', function (err, res) {
					ok(res > 1);
					done();
				});
			});
		});

		it('should not set an expiration when told not to', done => {
			const store = new RedisDocumentStore({ expire: 10 });
			store.set(
				'hello2',
				'world',
				function () {
					client.ttl('hello2', function (err, res) {
						equal(-1, res);
						done();
					});
				},
				true
			);
		});

		it('should not set an expiration when expiration is off', done => {
			const store = new RedisDocumentStore({ expire: false });
			store.set('hello3', 'world', function () {
				client.ttl('hello3', function (err, res) {
					equal(-1, res);
					done();
				});
			});
		});
	});
});
