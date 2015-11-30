jade = require('jade')
fs = require('fs-extra')
filewalker = require('filewalker')
_ = require('lodash')
q = require('q')
async = require('async')
rmdir = require('rmdir')
less = require('less')
moment = require('moment')
LineByLineReader = require('line-by-line')
String.prototype.capitalize = ->
    return this.replace(/(?:^|\s)\S/g, (a) -> return a.toUpperCase(); );

Jmonkey = (obj) ->
	jmonkey = {
		that: this,
		methodQ: [],
		qStarted: false,
		site_dir: obj.source if(typeof obj isnt "undefined" && typeof obj.source isnt "undefined"),
		dest_dir: obj.source + '/build' if(typeof obj isnt "undefined" && typeof obj.source isnt "undefined"),
		source: obj.source + '/source' if(typeof obj isnt "undefined" && typeof obj.source isnt "undefined"),
		tmp_source: obj.source + '/.tmp_source' if(typeof obj isnt "undefined" && typeof obj.source isnt "undefined"),
		config_file: obj.source + '/config.json' if(typeof obj isnt "undefined" && typeof obj.source isnt "undefined")	
		config_obj: {},
		auto_generated_menu: null,
		startTime: new moment()
		prepare: ->
			jmonkey.startTime = new moment()
			jmonkey.addQ (cb) ->
				async.parallel([
					(asynccb) ->
						if(fs.existsSync(jmonkey.dest_dir))
							rmdir(jmonkey.dest_dir, (err,dirs,files) ->
								fs.mkdir(jmonkey.dest_dir, ->
									#cb()
									asynccb(err)
								)
							)
							return
								
						else 
							fs.mkdir(jmonkey.dest_dir, (err) ->
								#cb()
								asynccb(err)
							)
						return
					(asynccb) ->
						fs.readFile(jmonkey.config_file, 'utf8', (err, data) ->
							if(err)

							else
								jmonkey.config_obj = JSON.parse(data)
								asynccb(err)
							return
						)
						return
					(asynccb) ->
						fs.copy(jmonkey.source, jmonkey.tmp_source, (err) -> 
							if (err) 
								return asynccb(err)
							asynccb()
							
						)
				], (err, results)->
					cb()
				);
				
				
				return

			return jmonkey

		swaps: ->
			
			jmonkey.addQ (cb) ->
				#go through every jade file and make the swaps
				fileSwapArray = [];
				jmonkey.buildMenu().then( (menuObject) ->	
					filewalker(jmonkey.tmp_source)
						.on('file', (p, s) ->
							#for each file, if
							if p.indexOf('DS_Store') == -1
								fileSwapArray.push( (asynccb) ->
									#function for making a load of swaps
									fs.readFile(jmonkey.tmp_source + '/' + p, 'utf8', (err, filecontents)->
										if (err) 
											return asynccb(err)

										#swap variables first
										i = 0
										keys = Object.keys(jmonkey.config_obj.vars)
										while i < keys.length
												key = keys[i]
												re = new RegExp(key, 'g');
												filecontents = filecontents.replace(re, jmonkey.config_obj.vars[key]);
												i++

										#next swap colors
										i = 0
										keys = Object.keys(jmonkey.config_obj.colors)
										while i < keys.length
												key = keys[i]

												re = new RegExp(key, 'g');
												filecontents = filecontents.replace(re, jmonkey.config_obj.colors[key]);
												
												i++

										#put in the local directory absolute path
										re = new RegExp('localdir', 'g');
										filecontents = filecontents.replace(re, jmonkey.tmp_source);

										#put in the menuobject
										menu = []
										re = new RegExp('MENUOBJECT', 'g');
										filecontents = filecontents.replace(re, JSON.stringify(menuObject));

										fs.writeFile(jmonkey.tmp_source + '/' + p, filecontents, 'utf8', (err) ->
											if (err) 
												return asynccb(err)
											
											asynccb()
											
										);

									);

									
								)
						)
						.on('done', ->
							async.eachSeries fileSwapArray, ((item, cb) ->
								item cb
								return
							), (err, results) ->
								#done
								cb()
						)
						.walk();
					)
				return
			return jmonkey

		jade: ->
			jmonkey.addQ (cb) ->
				jadeArray = [];
				filewalker(jmonkey.tmp_source + '/site')
					.on('file', (p, s) ->
						if p.substr(p.length - 5)==".jade"
							
							jadeArray.push( (asynccb) ->
								fn = jade.compileFile(jmonkey.tmp_source + '/site/' + p, {
									pretty: true,
									basedir: "/"
								});
								html = fn();
								#got the jade, now to create/write the file
								#first get the new path to the file
								newFileName = jmonkey.removePrefixOrdering(p, true);
								jmonkey.writeFile(jmonkey.dest_dir + '/' + newFileName, html).then(->
									asynccb()
								)
							)
					)
					.on('done', ->
						async.eachSeries jadeArray, ((item, cb) ->
							item cb
							return
						), (err, results) ->
							#done
							cb()
					)
					.walk()

			return jmonkey


		less: ->
			jmonkey.addQ (cb) ->
				lessArray = [];
				filewalker(jmonkey.tmp_source + '/less', {recursive:false})
					.on('file', (p, s) ->
						if p.substr(p.length - 5)==".less"
							lessArray.push( (asynccb) ->
								fs.readFile(jmonkey.tmp_source + '/less/' + p, 'utf8', (err, data) ->
									if (err)
										return asynccb(err)
									
									less.render(data,{
										paths: [jmonkey.tmp_source + '/less/lib'],
										compress: false
									},
									(e, output) ->
										if e
											console.log(e);
											return 

										newFileName = p.slice(0, -4) + 'css';
										jmonkey.writeFile(jmonkey.dest_dir + '/styles/' + newFileName, output.css).then(->
											asynccb()
										)
									);
								);
							)
					)
					.on('done', ->
						async.eachSeries lessArray, ((item, cb) ->
							item cb
							return
						), (err, results) ->
							#done
							cb()
					)
					.walk()

			return jmonkey


		copyassets: ->
			jmonkey.addQ (cb) ->
				fs.copy(jmonkey.source + '/assets', jmonkey.dest_dir + '/assets', (err) -> 
					if (err) 
						throw err
					
					cb()
					
				)
			return jmonkey


		cleanup: ->
			jmonkey.addQ (cb) ->
				rmdir(jmonkey.tmp_source, (err,dirs,files) ->
					cb()
				)
			return jmonkey


		buildMenu: ->
			prom = q.defer();
			if (typeof jmonkey.config_obj.menu == 'undefined') || (jmonkey.config_obj.menu==null) || (jmonkey.config_obj.menu=="auto")
				if jmonkey.auto_generated_menu isnt null
					prom.resolve(jmonkey.auto_generated_menu)
				else
					newMenuArray = []
					#firs look in the root, to find top level menu items
					filewalker(jmonkey.tmp_source + '/site', {recursive:false})
					.on('file', (p, s) ->
						#first remove the prefixed number for page ordering

						variables = {}
						if p.substr(p.length - 5)==".jade"

							newP = jmonkey.removePrefixOrdering(p, false);
							
							lr = new LineByLineReader(jmonkey.tmp_source + '/site/' + p);

							lr.on('error', (err) ->
							    # something has gone wrong
							    #todo: handle this error
							)

							lr.on('line', (line) -> 
								if line.charAt(0)=='-'
									regex = /-(\w+): (.+)/;
									matches = []

									if ((matches = regex.exec(line)) != null)
										if (matches.index == regex.lastIndex)
											regex.lastIndex++;
										variables[matches[1].trim()] = matches[2].trim()
								else
									lr.close()
							)

							lr.on('end', ->
								if !variables.menuName && newP == 'index.jade'
									# we'll just set the name to home	
									variables.menuName = "Home"
								else if !variables.menuName
									# we'll guess the page name
									fileName =  newP.substring(0, newP.length - 5);
									parts = fileName.split("_");
									i = 0
									while i < parts.length
										parts[i] = parts[i].toLowerCase().capitalize();
										i++

									variables.menuName = parts.join(" ")
								newMenuArray.push({
									"name": variables.menuName,
									"href": newP.replace('.jade', '.html')
								})
							)
					)
					.on('done', ->
						jmonkey.auto_generated_menu = newMenuArray
						prom.resolve(newMenuArray)
					)
					.walk()

					#build menu
					# pages in the root site dir will be linked from the main menu

					#sub folders will create sub menus, an index in a sub folder will be created as the link for the sub page, order may be given by numerical ranking

					#_folders will be ignored, e.g. _blog, except with a link to the _blog index page, if there is one

					
			else
				#menu is built already
				prom.resolve(jmonkey.config_obj.menu)

			return prom.promise


		writeFile: (path, content) ->

			prom = q.defer();
			#ensure the directory exists first

			parts = path.split("/");
			if parts[0]==""
				parts.shift();
			#remove the actual file
			parts.pop()

			jmonkey.ensurePathExists("", parts).then(->
				fs.writeFile(path, content, 'utf8', (err) ->
					if (err) 
						return prom.reject(err)
					
					prom.resolve(true)
				);
			)

			
			return prom.promise;


		ensurePathExists: (currentDir, additions)->
			g = q.defer();
			
			if additions.length>0

				dirQuery = currentDir +  "/" + additions.shift();
				if !fs.existsSync(dirQuery)
					fs.mkdir(dirQuery, ->
						jmonkey.ensurePathExists(dirQuery, additions).then(->
							g.resolve(true)
						)
					)
				else
					jmonkey.ensurePathExists(dirQuery, additions).then(->
						g.resolve(true)
					)
			else
				g.resolve(true)
			

			g.resolve(true)

			return g.promise;


		removePrefixOrdering: (p, turnToHtml) ->
			nameParts = p.split("_");
			nameParts.shift();
			if(turnToHtml)
				return nameParts.join("_").replace('.jade', '.html')
			else
				return nameParts.join("_")


		#functions for controlling the syncronous Q
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
				jmonkey.qStarted = false

				nowTime = new moment();
				diff = nowTime.valueOf() - jmonkey.startTime.valueOf()
			return
	}



	return jmonkey

module.exports = Jmonkey