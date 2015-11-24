jade = require('jade')
fs = require('fs')
filewalker = require('filewalker')
_ = require('lodash')
q = require('q')
async = require('async')

Jmonkey = (obj) ->
	jmonkey = {
		that: this,
		source: obj.source if((typeof obj.source isnt "undefined") && obj.source?)
		dest: obj.dest if((typeof obj.dest isnt "undefined") && obj.dest?)
		compile: (callback) ->
			console.log('compiling...')
			setTimeout( -> 
				callback()
				return jmonkey
			2000)
	}

	return jmonkey

module.exports = Jmonkey