// Generated by CoffeeScript 1.10.0
(function() {
  var Jmonkey, LineByLineReader, _, async, filewalker, fs, jade, less, moment, q, rmdir;

  jade = require('jade');

  fs = require('fs-extra');

  filewalker = require('filewalker');

  _ = require('lodash');

  q = require('q');

  async = require('async');

  rmdir = require('rmdir');

  less = require('less');

  moment = require('moment');

  LineByLineReader = require('line-by-line');

  String.prototype.capitalize = function() {
    return this.replace(/(?:^|\s)\S/g, function(a) {
      return a.toUpperCase();
    });
  };

  Jmonkey = function(obj) {
    var jmonkey;
    jmonkey = {
      that: this,
      methodQ: [],
      qStarted: false,
      site_dir: typeof obj !== "undefined" && typeof obj.source !== "undefined" ? obj.source : void 0,
      dest_dir: typeof obj !== "undefined" && typeof obj.source !== "undefined" ? obj.source + '/build' : void 0,
      source: typeof obj !== "undefined" && typeof obj.source !== "undefined" ? obj.source + '/source' : void 0,
      tmp_source: typeof obj !== "undefined" && typeof obj.source !== "undefined" ? obj.source + '/.tmp_source' : void 0,
      config_file: typeof obj !== "undefined" && typeof obj.source !== "undefined" ? obj.source + '/config.json' : void 0,
      config_obj: {},
      auto_generated_menu: null,
      startTime: new moment(),
      prepare: function() {
        jmonkey.startTime = new moment();
        jmonkey.addQ(function(cb) {
          async.parallel([
            function(asynccb) {
              if (fs.existsSync(jmonkey.dest_dir)) {
                rmdir(jmonkey.dest_dir, function(err, dirs, files) {
                  return fs.mkdir(jmonkey.dest_dir, function() {
                    return asynccb(err);
                  });
                });
                return;
              } else {
                fs.mkdir(jmonkey.dest_dir, function(err) {
                  return asynccb(err);
                });
              }
            }, function(asynccb) {
              fs.readFile(jmonkey.config_file, 'utf8', function(err, data) {
                if (err) {

                } else {
                  jmonkey.config_obj = JSON.parse(data);
                  asynccb(err);
                }
              });
            }, function(asynccb) {
              return fs.copy(jmonkey.source, jmonkey.tmp_source, function(err) {
                if (err) {
                  return asynccb(err);
                }
                return asynccb();
              });
            }
          ], function(err, results) {
            return cb();
          });
        });
        return jmonkey;
      },
      swaps: function() {
        jmonkey.addQ(function(cb) {
          var fileSwapArray;
          fileSwapArray = [];
          jmonkey.buildMenu().then(function(menuObject) {
            return filewalker(jmonkey.tmp_source).on('file', function(p, s) {
              if (p.indexOf('DS_Store') === -1) {
                return fileSwapArray.push(function(asynccb) {
                  return fs.readFile(jmonkey.tmp_source + '/' + p, 'utf8', function(err, filecontents) {
                    var i, key, keys, menu, re;
                    if (err) {
                      return asynccb(err);
                    }
                    i = 0;
                    keys = Object.keys(jmonkey.config_obj.vars);
                    while (i < keys.length) {
                      key = keys[i];
                      re = new RegExp(key, 'g');
                      filecontents = filecontents.replace(re, jmonkey.config_obj.vars[key]);
                      i++;
                    }
                    i = 0;
                    keys = Object.keys(jmonkey.config_obj.colors);
                    while (i < keys.length) {
                      key = keys[i];
                      re = new RegExp(key, 'g');
                      filecontents = filecontents.replace(re, jmonkey.config_obj.colors[key]);
                      i++;
                    }
                    re = new RegExp('localdir', 'g');
                    filecontents = filecontents.replace(re, jmonkey.tmp_source);
                    menu = [];
                    re = new RegExp('MENUOBJECT', 'g');
                    filecontents = filecontents.replace(re, JSON.stringify(menuObject));
                    return fs.writeFile(jmonkey.tmp_source + '/' + p, filecontents, 'utf8', function(err) {
                      if (err) {
                        return asynccb(err);
                      }
                      return asynccb();
                    });
                  });
                });
              }
            }).on('done', function() {
              return async.eachSeries(fileSwapArray, (function(item, cb) {
                item(cb);
              }), function(err, results) {
                return cb();
              });
            }).walk();
          });
        });
        return jmonkey;
      },
      jade: function() {
        jmonkey.addQ(function(cb) {
          var jadeArray;
          jadeArray = [];
          return filewalker(jmonkey.tmp_source + '/site').on('file', function(p, s) {
            if (p.substr(p.length - 5) === ".jade") {
              return jadeArray.push(function(asynccb) {
                var fn, html, newFileName;
                fn = jade.compileFile(jmonkey.tmp_source + '/site/' + p, {
                  pretty: true,
                  basedir: "/"
                });
                html = fn();
                newFileName = jmonkey.removePrefixOrdering(p, true);
                return jmonkey.writeFile(jmonkey.dest_dir + '/' + newFileName, html).then(function() {
                  return asynccb();
                });
              });
            }
          }).on('done', function() {
            return async.eachSeries(jadeArray, (function(item, cb) {
              item(cb);
            }), function(err, results) {
              return cb();
            });
          }).walk();
        });
        return jmonkey;
      },
      less: function() {
        jmonkey.addQ(function(cb) {
          var lessArray;
          lessArray = [];
          return filewalker(jmonkey.tmp_source + '/less', {
            recursive: false
          }).on('file', function(p, s) {
            if (p.substr(p.length - 5) === ".less") {
              return lessArray.push(function(asynccb) {
                return fs.readFile(jmonkey.tmp_source + '/less/' + p, 'utf8', function(err, data) {
                  if (err) {
                    return asynccb(err);
                  }
                  return less.render(data, {
                    paths: [jmonkey.tmp_source + '/less/lib'],
                    compress: false
                  }, function(e, output) {
                    var newFileName;
                    if (e) {
                      console.log(e);
                      return;
                    }
                    newFileName = p.slice(0, -4) + 'css';
                    return jmonkey.writeFile(jmonkey.dest_dir + '/styles/' + newFileName, output.css).then(function() {
                      return asynccb();
                    });
                  });
                });
              });
            }
          }).on('done', function() {
            return async.eachSeries(lessArray, (function(item, cb) {
              item(cb);
            }), function(err, results) {
              return cb();
            });
          }).walk();
        });
        return jmonkey;
      },
      copyassets: function() {
        jmonkey.addQ(function(cb) {
          return fs.copy(jmonkey.source + '/assets', jmonkey.dest_dir + '/assets', function(err) {
            if (err) {
              throw err;
            }
            return cb();
          });
        });
        return jmonkey;
      },
      cleanup: function() {
        jmonkey.addQ(function(cb) {
          return rmdir(jmonkey.tmp_source, function(err, dirs, files) {
            return cb();
          });
        });
        return jmonkey;
      },
      buildMenu: function() {
        var prom;
        prom = q.defer();
        if ((typeof jmonkey.config_obj.menu === 'undefined') || (jmonkey.config_obj.menu === null) || (jmonkey.config_obj.menu === "auto")) {
          if (jmonkey.auto_generated_menu !== null) {
            prom.resolve(jmonkey.auto_generated_menu);
          } else {
            jmonkey.buildDirMenu(jmonkey.tmp_source + '/site', jmonkey.tmp_source + '/site').then(function(builtArray) {
              return prom.resolve(builtArray);
            });
          }
        } else {
          prom.resolve(jmonkey.config_obj.menu);
        }
        return prom.promise;
      },
      writeFile: function(path, content) {
        var parts, prom;
        prom = q.defer();
        parts = path.split("/");
        if (parts[0] === "") {
          parts.shift();
        }
        parts.pop();
        jmonkey.ensurePathExists("", parts).then(function() {
          return fs.writeFile(path, content, 'utf8', function(err) {
            if (err) {
              return prom.reject(err);
            }
            return prom.resolve(true);
          });
        });
        return prom.promise;
      },
      ensurePathExists: function(currentDir, additions) {
        var dirQuery, g;
        g = q.defer();
        if (additions.length > 0) {
          dirQuery = currentDir + "/" + additions.shift();
          if (!fs.existsSync(dirQuery)) {
            fs.mkdir(dirQuery, function() {
              return jmonkey.ensurePathExists(dirQuery, additions).then(function() {
                return g.resolve(true);
              });
            });
          } else {
            jmonkey.ensurePathExists(dirQuery, additions).then(function() {
              return g.resolve(true);
            });
          }
        } else {
          g.resolve(true);
        }
        g.resolve(true);
        return g.promise;
      },
      buildDirMenu: function(dir, root) {
        var menuArray, prom, todoArray;
        prom = q.defer();
        menuArray = [];
        todoArray = [];
        filewalker(dir, {
          recursive: false
        }).on('file', function(p, s) {
          todoArray.push(function(asynccb) {
            var lr, newP, variables;
            variables = {};
            if (p.substr(p.length - 5) === ".jade") {
              newP = jmonkey.removePrefixOrdering(p, false);
              lr = new LineByLineReader(dir + '/' + p);
              lr.on('error', function(err) {});
              lr.on('line', function(line) {
                var matches, regex;
                if (line.charAt(0) === '-') {
                  regex = /-(\w+): (.+)/;
                  matches = [];
                  if ((matches = regex.exec(line)) !== null) {
                    if (matches.index === regex.lastIndex) {
                      regex.lastIndex++;
                    }
                    return variables[matches[1].trim()] = matches[2].trim();
                  }
                } else {
                  return lr.close();
                }
              });
              lr.on('end', function() {
                var fileName, i, newMenuObject, parts;
                if (!variables.menuName && newP === 'index.jade' && dir === root) {
                  variables.menuName = "Home";
                  variables.href = newP.replace('.jade', '.html');
                } else if (!variables.menuName && newP === 'index.jade' && dir !== root) {

                } else if (!variables.menuName) {
                  fileName = newP.substring(0, newP.length - 5);
                  parts = fileName.split("_");
                  i = 0;
                  while (i < parts.length) {
                    parts[i] = parts[i].toLowerCase().capitalize();
                    i++;
                  }
                  variables.menuName = parts.join(" ");
                  variables.href = newP.replace('.jade', '.html');
                }
                newMenuObject = {};
                newMenuObject.name = variables.menuName;
                if (variables.href) {
                  newMenuObject.href = variables.href;
                }
                if (variables.menuName) {
                  menuArray.push(newMenuObject);
                }
                return asynccb();
              });
            } else {
              asynccb();
            }
          });
        }).on('dir', function(p) {
          return todoArray.push(function(asynccb) {
            var dirName, i, multi, newMenuObject, parts, potentialIndexFile, variables;
            multi = false;
            variables = {};
            dirName = jmonkey.removePrefixOrdering(p, false);
            parts = dirName.split("_");
            if (parts[parts.length - 1] === 'multi') {
              multi = true;
              parts.pop();
            }
            i = 0;
            while (i < parts.length) {
              parts[i] = parts[i].toLowerCase().capitalize();
              i++;
            }
            variables.menuName = parts.join(" ");
            newMenuObject = {};
            newMenuObject.name = variables.menuName;
            potentialIndexFile = dir + '/' + p + '/index.jade';
            return fs.exists(potentialIndexFile, function(exists) {
              var lr, newSub;
              if (exists) {
                lr = new LineByLineReader(potentialIndexFile);
                lr.on('error', function(err) {});
                lr.on('line', function(line) {
                  var matches, regex;
                  if (line.charAt(0) === '-') {
                    regex = /-(\w+): (.+)/;
                    matches = [];
                    if ((matches = regex.exec(line)) !== null) {
                      if (matches.index === regex.lastIndex) {
                        regex.lastIndex++;
                      }
                      return variables[matches[1].trim()] = matches[2].trim();
                    }
                  } else {
                    return lr.close();
                  }
                });
                return lr.on('end', function() {
                  var newSub;
                  return newSub = jmonkey.buildDirMenu(dir + '/' + p, root).then(function(response) {
                    newMenuObject.sub = response;
                    if (variables.inTop) {
                      newMenuObject.href = "work out href";
                    }
                    if (variables.menuName) {
                      menuArray.push(newMenuObject);
                    }
                    asynccb();
                    return console.log(newMenuObject);
                  });
                });
              } else {
                return newSub = jmonkey.buildDirMenu(dir + '/' + p, root).then(function(response) {
                  newMenuObject.sub = response;
                  if (variables.menuName) {
                    menuArray.push(newMenuObject);
                  }
                  return asynccb();
                });
              }
            });
          });
        }).on('done', function() {
          return async.eachSeries(todoArray, (function(item, cb) {
            item(cb);
          }), function(err, results) {
            return prom.resolve(menuArray);
          });
        }).walk();
        return prom.promise;
      },
      removePrefixOrdering: function(p, turnToHtml) {
        var nameParts;
        nameParts = p.split("_");
        if ((nameParts[0].length === 4) && !isNaN(parseInt(nameParts[0][0])) && !isNaN(parseInt(nameParts[0][1])) && !isNaN(parseInt(nameParts[0][2])) && !isNaN(parseInt(nameParts[0][3]))) {
          nameParts.shift();
        }
        if (turnToHtml) {
          return nameParts.join("_").replace('.jade', '.html');
        } else {
          return nameParts.join("_");
        }
      },
      randomString: function() {
        var i, possible, text;
        text = "";
        possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        i = 0;
        while (i < 10) {
          text += possible.charAt(Math.floor(Math.random() * possible.length));
          i++;
        }
        return text;
      },
      addQ: function(method) {
        jmonkey.methodQ.push(method);
        process.nextTick(function() {
          if (!jmonkey.qStarted) {
            jmonkey.startQ();
          }
        });
      },
      startQ: function() {
        jmonkey.qStarted = true;
        async.eachSeries(jmonkey.methodQ, (function(item, cb) {
          item(cb);
        }), function(err, results) {
          var diff, nowTime;
          jmonkey.qStarted = false;
          nowTime = new moment();
          return diff = nowTime.valueOf() - jmonkey.startTime.valueOf();
        });
      }
    };
    return jmonkey;
  };

  module.exports = Jmonkey;

}).call(this);
