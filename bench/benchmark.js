/**
 * @author Michał Żaloudik <ponury.kostek@gmail.com>
 */
"use strict";
const Benchmark = require('benchmark');
const suite = new Benchmark.Suite;
const Cache = require('../');
const dll = new Cache();
for (var i = 0; i < 10000; i++) {
	dll.set('' + i, i);
	dll.get('' + i);
}
suite.add('Cache.set', function () {
	const dll = new Cache();
	for (var i = 0; i < 10000; i++) {
		dll.set('' + i, i);
	}
}).add('Cache.get', function () {
	for (var i = 0; i < 10000; i++) {
		dll.get('' + i);
	}
}).on('cycle', function (event) {
	console.log(String(event.target));
}).on('complete', function () {
	//console.log('Fastest is ' + this.filter('fastest').map('name').join(', '));
}).run({'async' : true});
