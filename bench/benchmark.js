/**
 * @author Michał Żaloudik <ponury.kostek@gmail.com>
 */
"use strict";
const Benchmark = require('benchmark');
const suite = new Benchmark.Suite;
const Cache = require('../');
const dll = new Cache({
	limit : 5e5,
	ttl : 1e9
});
for (var i = 0; i < 1e5; i++) {
	dll.set('' + i, i);
}
suite.add('Cache.set', function () {
	const dll = new Cache({
		limit : 5e5,
		ttl : 1e6
	});
	for (var i = 0; i < 1e5; i++) {
		dll.set('' + i, i);
	}
}).add('Cache.get', function () {
	for (var i = 0; i < 1e5; i++) {
		dll.get('' + i);
	}
}).on('cycle', function (event) {
	console.log(String(event.target));
}).on('complete', function () {
	//console.log('Fastest is ' + this.filter('fastest').map('name').join(', '));
	console.log('size', dll.size ? dll.size() : dll.count);
	console.log('stats', dll.getStats());
}).run({'async' : true});
