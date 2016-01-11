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
	 * @param {Object} [options]
	 * @param {Number} [options.gci=1000] GC interval in ms
	 * @param {Number} [options.limit=1048576] Cache entries limit
	 * @param {Number} [options.ttl=10] Entry TTL in sec
	 * @param {Boolean} [options.disableGC] Disables GC
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
		this.disableGC = !!options.disableGC;
		this.count = 0;
		this._stopGC = false;
		this.clear();
		if (!this.disableGC && this.gci > 0) {
			this.gcStart();
		}
	}

	/**
	 * Gets value of key if exists
	 * @param {String} key
	 * @returns {*}
	 */
	get(key) {
		// key = typeof key == 'String' ? key : String(key).valueOf();
		return this.data[this.keyIndex[key]] !== undefined ? this.data[this.keyIndex[key]].value : undefined;
	}

	/**
	 * Sets
	 * @param {String} key
	 * @param {*} value
	 * @param {Number} ttl
	 */
	set(key, value, ttl) {
		// key = typeof key == 'String' ? key : String(key).valueOf();
		if (this.has(key)) {
			this.ttlIndex[key] = utls.microtime();
			if (value !== undefined) {
				this.data[this.keyIndex[key]].value = value;
			}
			this.data[this.keyIndex[key]].ttl = ttl || this.ttl;
		} else {
			let idx = this.data.push({
					value : value,
					ttl : ttl || this.ttl
				}) - 1;
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
		// key = typeof key == 'String' ? key : String(key).valueOf();
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
		return Object.getOwnPropertyNames(this.keyIndex).filter(k => this.has(k), this);
	}

	/**
	 * Returns all cached values
	 * @returns {Array}
	 */
	values() {
		return this.data.filter((v) => {
			return v !== undefined;
		}).map(v => v.value);
	}

	/**
	 * Deletes entry
	 * @param {String} key
	 */
	delete(key) {
		// key = typeof key == 'String' ? key : String(key).valueOf();
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
		var newKeyIndex = {}, newKeyRindex = [], newTtlIndex = {}, newData = [], self = this;
		// console.time('GC TTL');
		this.keyRindex.map((key) => {
			if (this.ttlIndex.hasOwnProperty(key) && utls.microtime() - this.ttlIndex[key] > this.data[this.keyIndex[key]].ttl) {
				this.delete(key);
			}
		});
		// console.timeEnd('GC TTL');
		this.count = 0;
		// console.time('GC TTL filter');
		this.keyRindex = this.keyRindex.filter(v => v !== undefined);
		// console.timeEnd('GC TTL filter');
		// console.time('GC TTL rebuild');
		this.keyRindex.map((key, index) => {
			process.stdout.write('r');
			newKeyIndex[key] = newData.push(self.data[index]);
			newKeyRindex[newKeyIndex[key]] = key;
			newTtlIndex[key] = self.ttlIndex[key];
			self.count++;
		});
		// console.timeEnd('GC TTL rebuild');
		// console.time('GC Reassign');
		this.data = newData;
		this.keyIndex = newKeyIndex;
		this.keyRindex = newKeyRindex;
		this.ttlIndex = newTtlIndex;

		newData = newKeyIndex = newKeyRindex = newTtlIndex = undefined;

		if (!this.disableGC && !this._stopGC) {
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
