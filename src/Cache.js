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
 * @param key
 * @param value
 * @param dll
 * @param ttl
 * @constructor
 */
function CacheItem(key, value, dll, ttl) {
	let self = this;
	if (!(self instanceof CacheItem)) {
		self = new CacheItem(key, value, dll, ttl);
	}
	self.key = key;
	self.dllNode = dll.unshift(key);
	self.value = value;
	self.expireAt = ttl > 0 ? utls.microtime() + ttl : 0;
	return self;
}
/**
 *
 */
CacheItem.prototype.touch = function () {
	//console.log('CacheItem -> touch()', this.key);
	this.dllNode.list.unshift(this.dllNode);
	return this;
};
/**
 *
 * @param options
 * @constructor
 */
function LRUCache(options) {
	this.map = new Map();
	this.dll = new Yadll();
	this.maxLength = options.maxLength || 100;
	this.maxAge = options.maxAge;
}
/**
 *
 * @param key
 * @param value
 * @returns {*}
 */
LRUCache.prototype.set = function (key, value) {
	if (this.map.has(key)) {
		const item = this.getItem(key);
		item.value = value;
		return item;
	}
	if (!(value instanceof CacheItem)) {
		value = new CacheItem(key, value, this.dll, this.maxAge);
	}
	return this.setItem(key, value);
};
/**
 *
 * @param key
 */
LRUCache.prototype.get = function (key) {
	if (!this.map.has(key)) {
		return;
	}
	const item = this.getItem(key);
	if (item.expireAt !== 0 && item.expireAt < utls.microtime()) {
		this.delete(key);
		return;
	}
	return item.touch().value;
};
/**
 *
 * @param key
 * @returns {boolean}
 */
LRUCache.prototype.delete = function (key) {
	return this.deleteItem(key);
};
/**
 *
 * @param key
 * @returns {boolean}
 */
LRUCache.prototype.has = function (key) {
	return this.map.has(key);
};
/**
 *
 * @param {String} key
 * @param {CacheItem}item
 * @returns {*}
 */
LRUCache.prototype.setItem = function (key, item) {
	//console.log('LRUCache -> setItem(key, value)', key);
	if (this.map.has(key)) {
		if (this.map.get(key) === item) {
			return item.touch();
		}
		this.deleteItem(key);
	}
	this.map.set(key, item);
	if (this.map.size >= this.maxLength) {
		this.trim();
	}
	return item;
};
/**
 *
 * @param {String} key
 * @returns {CacheItem}
 */
LRUCache.prototype.getItem = function (key) {
	return this.map.get(key);
};
/**
 *
 * @param key
 * @returns {boolean}
 */
LRUCache.prototype.deleteItem = function (key) {
	const item = this.getItem(key);
	if (item) {
		this.map.delete(key);
		return true;
	}
	return false;
};
/**
 *
 */
LRUCache.prototype.trim = function () {
	this.deleteItem(this.dll.pop().value);
};
/**
 *
 * @returns {number}
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
module.exports = LRUCache;
module.exports.CacheItem = CacheItem;