var Jmonkey = require('./dist/index')

var test = new Jmonkey({
	source: './src_dir',
	dest: './destination'
}).compile(function(){
	console.log('done 1');
}).compile(function(){
	console.log('done 2')
})