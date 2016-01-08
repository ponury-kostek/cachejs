"use strict";
var utls = require("utls");
var maxLimit = 1048576; // 1M
var maxGci = 86400;
var maxTtl = 3600;
/**
 * Node.js in memory cache
 *
 * @author Michał Żaloudik <michal.zaloudik@redcart.pl>
 */
class Cache {

	/**
	 * Constructor
	 * @param {object} [options]
	 * @param {number} [options.gci=1000] GC interval in ms
	 * @param {number} [options.limit=1048576] Cache entries limit
	 * @param {number} [options.ttl=10] Entry TTL in sec
	 */
	constructor(options) {
		options = options || {};
		options.gci = parseInt(options.gci, 10) || 1000;
		options.limit = parseInt(options.limit, 10) || maxLimit;
		options.ttl = parseInt(options.ttl, 10) || 10;

		if (options.limit < 1) {
			options.limit = 1;
		}
		if (options.limit > maxLimit) {
			options.limit = maxLimit;
		}
		if (options.gci < 1) {
			options.gci = 1;
		}
		if (options.gci > maxGci) {
			options.gci = maxGci;
		}
		if (options.ttl < 1) {
			options.ttl = 1;
		}
		if (options.ttl > maxTtl) {
			options.ttl = maxTtl;
		}
		this.limit = options.limit;
		this.ttl = options.ttl;
		this.gci = options.gci;
		this.count = 0;
		this.gcInProgress = false;
		this._stopGC = false;
		this.clear();
		if (this.gci > 0) {
			this.gcStart();
		}
	}

	/**
	 * Gets value of key if exists
	 * @param {String} key
	 * @returns {*}
	 */
	get(key) {
		key = typeof key == 'string' ? key : String(key).valueOf();
		return this.data[this.keyIndex[key]];
	}

	/**
	 * Sets
	 * @param {String} key
	 * @param {*} value
	 */
	set(key, value) {
		key = typeof key == 'string' ? key : String(key).valueOf();
		if (this.has(key)) {
			this.ttlIndex[key] = utls.microtime();
			this.data[this.keyIndex[key]] = value;
		} else {
			let idx = this.data.push(value);
			this.keyIndex[key] = idx;
			this.keyRindex[idx] = key;
			this.ttlIndex[key] = utls.microtime();
			this.count++;
			if (this.count > this.limit) {
				for (let i = 0; i < this.keyRindex.length; i++) {
					if (this.keyRindex[i] !== undefined) {
						this.delete(this.keyRindex[i]);
						break;
					}
				}
			}
		}
	}

	/**
	 *
	 * @param {String} key
	 * @returns {Boolean}
	 */
	has(key) {
		key = typeof key == 'string' ? key : String(key).valueOf();
		if (this.keyIndex[key] !== undefined) {
			if (this.data[this.keyIndex[key]] !== undefined) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Clears cache entries
	 */
	clear() {
		this.ttlIndex = {};
		this.keyIndex = {};
		this.keyRindex = [];
		this.data = [];
		this.count = 0;
	}

	/**
	 *
	 * @returns {Array}
	 */
	keys() {
		return Object.getOwnPropertyNames(this.keyIndex);
	}

	/**
	 * Returns all cached values
	 * @returns {Array}
	 */
	values() {
		return this.data.map((v) => {
			return v;
		});
	}

	/**
	 * Deletes entry
	 * @param {String} key
	 */
	delete(key) {
		key = typeof key == 'string' ? key : String(key).valueOf();
		if (this.has(key)) {
			this.data[this.keyIndex[key]] = undefined;
			this.keyRindex[this.keyIndex[key]] = undefined;
			this.keyIndex[key] = undefined;
			this.ttlIndex[key] = undefined;
			this.count--;
		}
	}

	/**
	 * Garbage collecting
	 */
	gc() {
		if (this.gcInProgress) {
			return;
		}
		this.gcInProgress = true;
		var newKeyIndex = {}, newKeyRindex = [], newTtlIndex = {}, newData = [], self = this;
		this.keyRindex.map((key) => {
			if (this.ttlIndex.hasOwnProperty(key) && utls.microtime() - this.ttlIndex[key] > this.ttl) {
				this.delete(key);
			}
		});
		this.count = 0;
		this.keyRindex.map((key, index) => {
			newKeyIndex[key] = newData.push(self.data[index]);
			newKeyRindex[newKeyIndex[key]] = key;
			newTtlIndex[key] = self.ttlIndex[key];
			self.count++;
		});
		this.data = newData;
		this.keyIndex = newKeyIndex;
		this.keyRindex = newKeyRindex;
		this.ttlIndex = newTtlIndex;

		newData = newKeyIndex = newKeyRindex = newTtlIndex = undefined;

		if (this.count > this.limit) {
			//FIXME
			let diff = this.count - this.limit;
			let tbd = this.keyRindex.splice(0, diff);
			tbd.forEach((v) => {
				self.delete(v);
			});
		}
		this.gcInProgress = false;
		if(!this._stopGC) {
			this.gcStart();
		}
	}

	/**
	 * Starts garbage collecting
	 */
	gcStart() {
		this._stopGC = false;
		if (!this.gcIsRunning()) {
			this._gci = setTimeout(this.gc, this.gci * 1000);
			this._gci.unref();
		}
	}

	/**
	 * Stops garbage collecting
	 */
	gcStop() {
		if (this.gcIsRunning()) {
			clearTimeout(this._gci);
		}
		this._stopGC = true;
	}

	/**
	 * Determinates whatever GC is running
	 * @returns {Boolean}
	 */
	gcIsRunning() {
		return this._gci !== undefined && this._gci._idleTimeout !== undefined && this._gci._idleTimeout > 0;
	}

	destroy() {
		this.gcStop();
		this.clear();
	}
}

module.exports = Cache;
