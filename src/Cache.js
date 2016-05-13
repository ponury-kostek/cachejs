"use strict";
var maxLimit = 1048576;
var maxGci = 86400;
var maxTtl = 3600;
var overheadRatio = 1.15;
var utls = require('utls');
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
	 * @param {Boolean} [options.disableGC=false] Disables GC
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
		this.clear();
		this.clearStatistics();
		if (!this.disableGC && this.gci > 0) {
			this.gcStart();
		}
	}

	clearStatistics() {
		this.statistics = {
			resets : 0,
			obsolate : 0,
			hits : 0,
			misses : 0,
			removed : 0,
			gcCycles : 0,
			trims : 0,
			trimedItems : 0,
			new : 0
		};
	}

	getStatistics() {
		var statistics = utls.vcopy(this.statistics);
		statistics.limit = this.limit;
		statistics.count = this.count;
		this.clearStatistics();
		return statistics;
	}

	/**
	 * Sets
	 * @param {String} key
	 * @param {*} value
	 * @param {Number} ttl
	 */
	set(key, value, ttl) {
		if (this.has(key)) {
			this.statistics.resets++;
			if (value !== undefined) {
				clearTimeout(this.data[this.keyIndex[key]].timeout);
				this.data[this.keyIndex[key]] = {
					value : value,
					timeout : setTimeout(() => {
						this.statistics.obsolate++;
						this.remove(key);
					}, (ttl || this.ttl) * 1000)
				};
			}
		} else {
			this.statistics.new++;
			var idx = this.data.push({
					value : value,
					timeout : setTimeout(() => {
						this.statistics.obsolate++;
						this.remove(key);
					}, (ttl || this.ttl) * 1000)
				}) - 1;
			this.keyIndex[key] = idx;
			this.keyRindex[idx] = key;
			this.count++;
			if (this.count > (overheadRatio * this.limit)) {
				this.trim();
			}
		}
	}

	/**
	 * Gets value of key if exists
	 * @param {String} key
	 * @returns {*}
	 */
	get(key) {
		if (this.data[this.keyIndex[key]] !== undefined) {
			this.statistics.hits++;
			return this.data[this.keyIndex[key]].value;
		} else {
			this.statistics.misses++;
		}
	}

	/**
	 *
	 * @param {String} key
	 * @returns {Boolean}
	 */
	has(key) {
		if (this.keyIndex[key] !== undefined) {
			if (this.data[this.keyIndex[key]] !== undefined) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Deletes entry
	 * @param {String} key
	 */
	remove(key) {
		if (this.has(key)) {
			this.statistics.removed++;
			var idx = this.keyIndex[key];
			clearTimeout(this.data[idx].timeout);
			this.data[idx] = undefined;
			this.keyRindex[idx] = undefined;
			this.keyIndex[key] = undefined;
			this.count--;
		}
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
	 * Garbage collecting
	 */
	gc() {
		this.statistics.gcCycles++;
		var newKeyIndex = {}, newKeyRindex = [], newData = [];
		if (this.count > this.limit) {
			this.trim();
		}
		this.count = 0;
		this.keyRindex.map((key, index) => {
			if (key !== undefined) {
				newKeyIndex[key] = newData.push(this.data[index]) - 1;
				newKeyRindex[newKeyIndex[key]] = key;
				this.count++;
			}
		});
		this.data = newData;
		this.keyIndex = newKeyIndex;
		this.keyRindex = newKeyRindex;
		newData = newKeyIndex = newKeyRindex = undefined;
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
			this._gci = setTimeout(() => {
				this.gc();
			}, this.gci * 1000);
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

	/**
	 * Clears cache entries
	 */
	clear() {
		this.keyIndex = {};
		this.keyRindex = [];
		if (this.data) {
			this.data.map((item) => {
				if (item !== undefined) {
					clearTimeout(item.timeout);
				}
			});
		}
		this.data = [];
		this.count = 0;
	}

	/**
	 * Stops gc and clears all data including timeouts
	 */
	destroy() {
		this.gcStop();
		this.clear();
	}

	/**
	 * Trims cache to setted limit
	 */
	trim() {
		this.statistics.trims++;
		var length = this.data.length;
		for (var i = 0; i < length; i++) {
			if (this.keyRindex[i] !== undefined) {
				this.statistics.trimedItems++;
				this.remove(this.keyRindex[i]);
				if (this.count <= this.limit) {
					return;
				}
			}
		}
	}
}
module.exports = Cache;
