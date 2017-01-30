"use strict";
var Cache = require('../');
var utls = require('utls');
var m = process.memoryUsage();
var i = 0;
var entries = 1000000;
var keys = [];
for (i = 0; i < entries; i++) {
	keys.push(`key${i}_${Math.random()}`);
}
/*for (var r = 0; r < -50; r++) {
	(() => {
		var entries = 100;
		var ents = [];
		for (i = 0; i < entries; i++) {
			var propName = `someProp${i}`;
			var methName = `someMeth${i}`;
			var obj = {};
			obj[propName] = `Some unique property value ${i}`;
			obj[methName] = () => {
				return `${i}`
			};
			ents.push(obj);
		}
		var cache = new Cache({maxLength : 10000});
		for (i = 0; i < entries; i++) {
			cache.set(keys[i], ents[i]);
		}
		for (i = 0; i < entries; i++) {
			cache.has(keys[i]);
		}
		for (i = 0; i < entries; i++) {
			cache.get(keys[i]);
		}

	})();
}*/
var ents = [];
for (i = 0; i < entries; i++) {
	keys.push('key' + i + '_' + Math.random());
}
for (let i = 0; i < entries; i++) {
	var propName = 'someProp' + i;
	var methName = 'someMeth' + i;
	var obj = {};
	obj[propName] = 'Some unique property value ' + i;
	obj[methName] = () => {
		return String(i);
	};
	ents.push(obj);
}
console.time("TOTAL");
var cache = new Cache({limit : 1, ttl: 100});
console.time("SET");
for (i = 0; i < entries; i++) {
	cache.set(keys[i], ents[i]);
}
console.timeEnd("SET");
console.log("Cache.count: " + cache.size());
var md = process.memoryUsage();
console.log("rss: " + ((m.rss) / (1024 * 1024)) + "\t\theapTotal: " + ((m.heapTotal) / (1024 * 1024)) + "\t\theapUsed: " + ((m.heapUsed) / (1024 * 1024)));
console.log("rss: " + ((md.rss) / (1024 * 1024)) + "\t\theapTotal: " + ((md.heapTotal) / (1024 * 1024)) + "\t\theapUsed: " + ((md.heapUsed) / (1024 * 1024)));
console.log("rss: " + ((md.rss - m.rss) / (1024 * 1024)) + "\t\theapTotal: " + ((md.heapTotal - m.heapTotal) / (1024 * 1024)) + "\t\theapUsed: " + ((md.heapUsed - m.heapUsed) / (1024 * 1024)));
console.time("HAS");
for (i = 0; i < entries; i++) {
	cache.has(keys[i]);
}
console.timeEnd("HAS");
console.time("GET");
var getStart = utls.microtime();
for (i = 0; i < entries; i++) {
	cache.get(keys[i]);
}
var getTime = utls.microtime() - getStart;
console.log('%d entries in %ds, %dops', entries, getTime, (entries / getTime).toFixed(2));
console.timeEnd("GET");
