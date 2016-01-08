"use strict";
var Cache = require(__dirname + '/../Cache.js');
let m = process.memoryUsage();
let entries = 1000;
let ents = [];
for (let i = 0; i < entries; i++) {
	let propName = `someProp${i}`;
	let methName = `someMeth${i}`;
	let obj = {};
	obj[propName] = `Some unique property value ${i}`;
	obj[methName] = () => {
		return `${i}`
	};
	ents.push(obj);
}
console.time("TOTAL");
let cache = new Cache({gci : 10000});
console.time("SET");
for (let i = 0; i < entries; i++) {
	cache.set(i, ents[i]);
}
console.timeEnd("SET");
console.log("Cache.count: " + cache.count);
let md = process.memoryUsage();
console.log("rss: " + ((m.rss) / (1024 * 1024)) + "\t\theapTotal: " + ((m.heapTotal) / (1024 * 1024)) + "\t\theapUsed: " + ((m.heapUsed) / (1024 * 1024)));
console.log("rss: " + ((md.rss) / (1024 * 1024)) + "\t\theapTotal: " + ((md.heapTotal) / (1024 * 1024)) + "\t\theapUsed: " + ((md.heapUsed) / (1024 * 1024)));
console.log("rss: " + ((md.rss - m.rss) / (1024 * 1024)) + "\t\theapTotal: " + ((md.heapTotal - m.heapTotal) / (1024 * 1024)) + "\t\theapUsed: " + ((md.heapUsed - m.heapUsed) / (1024 * 1024)));

console.time("HAS");
for (let i = 0; i < entries; i++) {
	cache.has(i);
}
console.timeEnd("HAS");

console.time("GET");
for (let i = 0; i < entries; i++) {
	cache.get(i);
}
console.timeEnd("GET");

console.time('GC');
cache.gc();
console.timeEnd('GC');

console.time("PREDEL");
let tbd = cache.keys();
console.timeEnd("PREDEL");

console.time("DELETE");
tbd.map((key) => {
	cache.delete(key);
});
console.timeEnd("DELETE");

cache.destroy();
console.timeEnd("TOTAL");
