/**
 * Node.js in memory cache
 *
 * @author Michał Żaloudik <michal.zaloudik@redcart.pl>
 */
"use strict";
const utls = require('utls');
const Yadll = require('yadll');
/**
 *
 * @param {*} key
 * @param {*} value
 * @param {Yadll} dll
 * @param {Number} ttl
 * @constructor
 */
function CacheItem(key, value, dll, ttl) {
	this.key = key;
	this.dllNode = dll.unshift(key);
	this.value = value;
	this.expireAt = ttl > 0 ? utls.microtime() + ttl : 0;
}
/**
 *
 */
CacheItem.prototype.touch = function () {
	this.dllNode.list.unshift(this.dllNode);
	return this;
};
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
 */
LRUCache.prototype.clearStats = function () {
	this.stats = {
		hits : 0,
		misses : 0,
		expires : 0,
		updates : 0
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
		return item;
	}
	if (!(value instanceof CacheItem)) {
		value = new CacheItem(key, value, this.dll, ttl || this.ttl || 0);
	}
	return this.setItem(key, value);
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
	if (item.expireAt !== 0 && item.expireAt < utls.microtime()) {
		this.stats.expires++;
		this.delete(key);
		return;
	}
	return item.touch().value;
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
 * @param {CacheItem}item
 * @returns {*}
 */
LRUCache.prototype.setItem = function (key, item) {
	if (this.map.has(key)) {
		if (this.map.get(key) === item) {
			return item.touch();
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
		return true;
	}
	return false;
};
/**
 *
 * @returns {Boolean}
 */
LRUCache.prototype.trim = function () {
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
	this.dll.clear();
};
/**
 *
 * @returns {Iterator.<K>}
 */
LRUCache.prototype.keys = function () {
	return this.map.keys();
};
/**
 *
 * @returns {Iterator.<V>}
 */
LRUCache.prototype.values = function () {
	return this.map.values();
};
module.exports = LRUCache;
module.exports.CacheItem = CacheItem;