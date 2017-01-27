/**
 * @author Michał Żaloudik <michal.zaloudik@redcart.pl>
 */
'use strict';
var assert = require('assert');
var utls = require('utls');
var Cache = require(__dirname + '/../'), cache;
describe('Cache', () => {
	describe.skip('constructing', () => {
		it('correct class', () => {
			cache = new Cache({
				limit : 100,
				ttl : 10
			});
			assert.equal(utls.getType(cache), 'Cache');
			cache.destroy();
		});
		it('correct options', () => {
			cache = new Cache({
				limit : 100,
				ttl : 10
			});
			assert.equal(cache.limit, 100);
			assert.equal(cache.ttl, 10);
			cache.destroy();
		});
		it('-1 options', () => {
			cache = new Cache({
				limit : -1,
				ttl : -1
			});
			assert.equal(cache.limit, 1);
			assert.equal(cache.ttl, 1);
			cache.destroy();
		});
		it('> MAX options', () => {
			cache = new Cache({
				limit : Number.MAX_SAFE_INTEGER,
				ttl : Number.MAX_SAFE_INTEGER
			});
			assert.equal(cache.limit, 1048576);
			assert.equal(cache.ttl, 3600);
			cache.destroy();
		});
	});
	describe('Base', () => {
		before(() => {
			cache = new Cache({
				maxLength : 2,
				ttl : 1000
			});
		});
		describe('SET', () => {
			let key = 'someKey';
			let value = {
				someProperty : "somePropertyValue",
				someMethod : () => {
					return 'someMethodResult';
				}
			};
			before(() => {
				cache.clear();
				cache.set(key, value);
			});
			it('has(key)', () => {
				assert.equal(cache.has(key), true);
			});
			it('get(key)', () => {
				assert.deepEqual(cache.get(key), value);
			});
			it.skip('values()', () => {
				assert.deepEqual(cache.values(), [value]);
			});
			it.skip('keys()', () => {
				assert.deepEqual(cache.keys(), [key]);
			});
			it('size()', () => {
				assert.equal(cache.size(), 1);
			});
		});
		describe('UPDATE', () => {
			let key = 'someKey';
			let value = {
				someProperty : "somePropertyValue",
				someMethod : () => {
					return 'someMethodResult';
				}
			};
			let value2 = {
				someProperty2 : "somePropertyValue2",
				someMethod2 : () => {
					return 'someMethodResult2';
				}
			};
			before(() => {
				cache.clear();
				cache.set(key, value);
				cache.set(key, value2);
			});
			it('get(key)', () => {
				assert.deepEqual(cache.get(key), value2);
			});
			it.skip('values()', () => {
				assert.deepEqual(cache.values(), [value2]);
			});
			it.skip('keys()', () => {
				assert.deepEqual(cache.keys(), [key]);
			});
		});
		describe('DELETE', () => {
			let key = 'someKey';
			let value = {
				someProperty : "somePropertyValue",
				someMethod : () => {
					return 'someMethodResult';
				}
			};
			before(() => {
				cache.clear();
				cache.set(key, value);
				//console.log(require('util').inspect(cache, {depth : 999}));
				cache.delete(key);
			});
			it('get(key)', () => {
				assert.deepEqual(cache.get(key), undefined);
			});
			it.skip('values()', () => {
				assert.deepEqual(cache.values(), []);
			});
			it.skip('keys()', () => {
				assert.deepEqual(cache.keys(), []);
			});
		});
		/*describe('TRIM', () => {
			before(() => {
				cache.clear();
			});
			it('', () => {
				for (var i = 0; i < 10; i++) {
					cache.set('i' + i, {i : i});
				}
			});
		});*/
		/*describe('GC', () => {
			it('', () => {
				cache.gc();
			});
		});*/
		/*describe('GETSTATISTICS', () => {
			it('', () => {
				console.log(cache.getStatistics());
			});
		});*/
		after(() => {
			//cache.destroy();
		});
	});
});