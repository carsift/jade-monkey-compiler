jade = require('jade')
fs = require('fs')
filewalker = require('filewalker')
_ = require('lodash')
q = require('q')
async = require('async')

Jmonkey = (obj) ->
	jmonkey = {
		that: this,
		methodQ: [],
		working: false,
		source: obj.source if((typeof obj.source isnt "undefined") && obj.source?)
		dest: obj.dest if((typeof obj.dest isnt "undefined") && obj.dest?)
		number: 0,
		add: (number) -> 
			args = arguments;
			if jmonkey.working
				jmonkey.addChink('add', arguments)
				return jmonkey
			jmonkey.working = true;
			
			jmonkey.number = jmonkey.number + number;
			setTimeout( ->
				args[args.length-1]() if (typeof args[args.length-1] != "undefined") && (typeof args[args.length-1] == "function")
				jmonkey.nextChink()
			2000);
			return jmonkey
		equals: (number) ->
			args = arguments;
			if jmonkey.working
				jmonkey.addChink('equals', arguments)
				return jmonkey
			jmonkey.working = true;
			
			console.log(jmonkey.number)
			setTimeout( ->
				args[args.length-1]() if (typeof args[args.length-1] != "undefined") && (typeof args[args.length-1] == "function")
				jmonkey.nextChink()
			2000);
			return jmonkey

		compile: () ->
			args = arguments;
			if jmonkey.working
				jmonkey.addChink('compile', arguments)
				return jmonkey
			jmonkey.working = true;
			
			setTimeout( -> 
				args[args.length-1]() if (typeof args.length-1 == 'function')
				jmonkey.nextChink()
			2000)
			return jmonkey

		addChink: (method, args) ->
			jmonkey.methodQ.push({method: method, args: args})
		nextChink: ->
			jmonkey.working = false;
			if jmonkey.methodQ.length>0
				nextMeth = jmonkey.methodQ.shift();
				methName = nextMeth.method
				args = nextMeth.args
				jmonkey[methName].apply(this, args)
	}



	return jmonkey

module.exports = Jmonkey