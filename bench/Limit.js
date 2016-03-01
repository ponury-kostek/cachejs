"use strict";
var Cache = require('../');
var m = process.memoryUsage();
var i = 0;
var entries = 1000000;
var keys = [];
for(i = 0; i< entries; i++) {
	keys.push(`key${i}_${Math.random()}`);
}
for (var r = 0; r < 50; r++) {
	(()=> {
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
		var cache = new Cache({gci : 10000});
		for (i = 0; i < entries; i++) {
			cache.set(keys[i], ents[i]);
		}
		for (i = 0; i < entries; i++) {
			cache.has(keys[i]);
		}
		for (i = 0; i < entries; i++) {
			cache.get(keys[i]);
		}
		cache.gc();
		var tbd = cache.keys();
		tbd.map((key) => {
			cache.remove(key);
		});
	})();
}
var ents = [];
for(i = 0; i< entries; i++) {
	keys.push(`key${i}_${Math.random()}`);
}
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
console.time("TOTAL");
var cache = new Cache({gci : 10000, limit: 100000});
console.time("SET");
for (i = 0; i < entries; i++) {
	cache.set(keys[i], ents[i]);
}
console.timeEnd("SET");
console.log("Cache.count: " + cache.count);
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
for (i = 0; i < entries; i++) {
	cache.get(keys[i]);
}
console.timeEnd("GET");
console.time('KEYS');
cache.keys();
console.timeEnd('KEYS');
console.time('VALUES');
cache.values();
console.timeEnd('VALUES');
console.time('GC');
cache.gc();
console.timeEnd('GC');
console.time("PREDEL");
var tbd = cache.keys();
console.timeEnd("PREDEL");
console.time("DELETE");
tbd.map((key) => {
	cache.remove(key);
});
console.timeEnd("DELETE");
cache.destroy();
console.timeEnd("TOTAL");
