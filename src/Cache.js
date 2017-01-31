/**
 * Node.js in memory cache
 *
 * @author Michał Żaloudik <michal.zaloudik@redcart.pl>
 */
"use strict";
const Yadll = require('yadll');
/**
 * @typedef {{size: number, hits: number, misses: number, expires: number, updates: number, trims: number}} CacheItem
 */
/**
 *
 */
var __now;
/**
 *
 * @private
 */
function ___update_now() {
	__now = Date.now();
	__update_now();
}
/**
 *
 * @private
 */
function __update_now() {
	setTimeout(___update_now, 10).unref();
}
___update_now();
/**
 *
 * @param {*} key
 * @param {*} value
 * @param {Yadll} dll
 * @param {Number} ttl
 * @returns {CacheItem}
 */
function cacheItem(key, value, dll, ttl) {
	return {
		key : key,
		dllNode : dll.unshift(key),
		value : value,
		expireAt : ttl > 0 ? __now + ttl : 0
	};
}
/**
 *
 * @param options
 * @constructor
 */
function LRUCache(options) {
	options = options || {};
	if (typeof options.limit === 'number') {
		if (options.limit <= 0) {
			options.limit = null;
		}
	} else {
		options.limit = null;
	}
	this.map = new Map();
	this.dll = new Yadll();
	this.limit = options.limit;
	this.ttl = options.ttl;
	this.clearStats();
}
/**
 *
 * @param item
 * @returns {*}
 */
LRUCache.prototype.touch = function (item) {
	this.dll.unshift(item.dllNode);
	return item;
};
/**
 *
 */
LRUCache.prototype.clearStats = function () {
	this.stats = {
		hits : 0,
		misses : 0,
		expires : 0,
		updates : 0,
		deletes : 0,
		trims : 0
	};
};
/**
 *
 * @returns {{size: number, hits: number, misses: number, expires: number, updates: number, trims: number}}
 */
LRUCache.prototype.getStats = function () {
	return {
		size : this.map.size,
		hits : this.stats.hits,
		misses : this.stats.misses,
		expires : this.stats.expires,
		updates : this.stats.updates,
		deletes : this.stats.deletes,
		trims : this.stats.trims
	};
};
/**
 *
 * @param {*} key
 * @param {*} value
 * @param {Number} [ttl]
 * @returns {*}
 */
LRUCache.prototype.set = function (key, value, ttl) {
	if (this.map.has(key)) {
		const item = this.getItem(key);
		item.value = value;
		this.stats.updates++;
		return this.touch(item);
	}
	const item = cacheItem(key, value, this.dll, ttl || this.ttl || 0);
	return this.setItem(key, item);
};
/**
 *
 * @param {*} key
 */
LRUCache.prototype.get = function (key) {
	if (this.map.has(key) === false) {
		this.stats.misses++;
		return;
	}
	this.stats.hits++;
	const item = this.getItem(key);
	if (item.expireAt !== 0 && item.expireAt < __now) {
		this.stats.expires++;
		this.deleteItem(key);
		return;
	}
	return this.touch(item).value;
};
/**
 *
 * @param {*} key
 * @returns {Boolean}
 */
LRUCache.prototype.delete = function (key) {
	return this.deleteItem(key);
};
/**
 *
 * @param {*} key
 * @returns {Boolean}
 */
LRUCache.prototype.has = function (key) {
	const result = this.map.has(key);
	if (result === true) {
		this.stats.hits++;
	} else {
		this.stats.misses++;
	}
	return result;
};
/**
 *
 * @param {*} key
 * @param {CacheItem} item
 * @returns {*}
 */
LRUCache.prototype.setItem = function (key, item) {
	if (this.map.has(key)) {
		if (this.map.get(key) === item) {
			return this.touch(item);
		}
		this.deleteItem(key);
	}
	if (this.limit && this.map.size >= this.limit) {
		this.trim();
	}
	this.map.set(key, item);
	return item;
};
/**
 *
 * @param {*} key
 * @returns {CacheItem}
 */
LRUCache.prototype.getItem = function (key) {
	return this.map.get(key);
};
/**
 *
 * @param {*} key
 * @returns {Boolean}
 */
LRUCache.prototype.hasItem = function (key) {
	return this.map.has(key);
};
/**
 *
 * @param {*} key
 * @returns {Boolean}
 */
LRUCache.prototype.deleteItem = function (key) {
	const item = this.getItem(key);
	if (item) {
		if (item.dllNode.list !== null) {
			item.dllNode.list.cut(item.dllNode);
		}
		this.map.delete(key);
		this.stats.deletes++;
		return true;
	}
	return false;
};
/**
 *
 * @returns {Boolean}
 */
LRUCache.prototype.trim = function () {
	this.stats.trims++;
	return this.deleteItem(this.dll.pop().value);
};
/**
 *
 * @returns {Number}
 */
LRUCache.prototype.size = function () {
	return this.map.size;
};
/**
 *
 */
LRUCache.prototype.clear = function () {
	this.map.clear();
	this.clearStats();
	this.dll.clear();
};
/**
 *
 * @returns {Iterator.<String>}
 */
LRUCache.prototype.keys = function () {
	return this.map.keys();
};
/**
 *
 * @returns {Iterator.<*>}
 */
LRUCache.prototype.values = function () {
	return this.map.values();
};
module.exports = LRUCache;
module.exports.CacheItem = cacheItem;