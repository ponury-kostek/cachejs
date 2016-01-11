/**
 * @author Michał Żaloudik <michal.zaloudik@redcart.pl>
 */
'use strict';
var assert = require('assert');
var utls = require('utls');
var Cache = require(__dirname + '/../'), cache;
describe('Cache', () => {
	describe('constructing', () => {
		before(() => {
			cache = new Cache({
				limit : 100,
				ttl : 10,
				gci : 1
			});
		});
		it('correct class', () => {
			assert.equal(utls.getType(cache), 'Cache');
		});
		it('options', () => {
			assert.equal(cache.limit, 100);
			assert.equal(cache.ttl, 10);
			assert.equal(cache.gci, 1);
		});
		after(() => {
			cache.destroy();
		});
	});
	describe('Base', () => {
		before(() => {
			cache = new Cache({
				limit : 1000,
				ttl : 1000,
				gci : 1000
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
				//console.log(require('util').inspect(cache, {depth : 999}));
			});
			it('has(key)', () => {
				assert.equal(cache.has(key), true);
			});
			it('get(key)', () => {
				assert.deepEqual(cache.get(key), value);
			});
			it('values()', () => {
				assert.deepEqual(cache.values(), [value]);
			});
			it('keys()', () => {
				assert.deepEqual(cache.keys(), [key]);
			});
			it('count', () => {
				assert.equal(cache.count, 1);
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
				//console.log(require('util').inspect(cache, {depth : 999}));
				cache.set(key, value2);
			});
			it('get(key)', () => {
				assert.deepEqual(cache.get(key), value2);
			});
			it('values()', () => {
				assert.deepEqual(cache.values(), [value2]);
			});
			it('keys()', () => {
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
			it('values()', () => {
				assert.deepEqual(cache.values(), []);
			});
			it('keys()', () => {
				assert.deepEqual(cache.keys(), []);
			});
		});
		after(() => {
			cache.destroy();
		});
	});
	describe('GC', () => {
		before(() => {
			cache = new Cache();
		});
		it('is running', () => {
			assert.equal(cache.gcIsRunning(), true);
		});
		/*it('is running', () => {
			cache.gcStop();
			assert.equal(cache.gcIsRunning(), false);
		});*/
		after(() => {
			cache.destroy();
		});
	});
});