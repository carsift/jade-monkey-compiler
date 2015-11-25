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
		number: 0,
		qStarted: false,
		

		meth: (number, callback) ->
			jmonkey.addQ (cb) ->
				#logic here
				jmonkey.number = jmonkey.number + number
				setTimeout(->
					callback()
					cb()
					return
				100)
				return 
			return jmonkey

		addQ: (method) -> 
			jmonkey.methodQ.push(method)
			process.nextTick( ->
				if(!jmonkey.qStarted)
					jmonkey.startQ()
				return
			);
			return

		startQ: ->
			jmonkey.qStarted = true
			async.eachSeries jmonkey.methodQ, ((item, cb) ->
				item cb
				return
			), (err, results) ->
				#done
			return
	}



	return jmonkey

module.exports = Jmonkey