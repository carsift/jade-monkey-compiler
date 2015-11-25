// Generated by CoffeeScript 1.10.0
(function() {
  var Jmonkey, _, async, filewalker, fs, jade, q;

  jade = require('jade');

  fs = require('fs');

  filewalker = require('filewalker');

  _ = require('lodash');

  q = require('q');

  async = require('async');

  Jmonkey = function(obj) {
    var jmonkey;
    jmonkey = {
      that: this,
      methodQ: [],
      number: 0,
      qStarted: false,
      meth: function(number, callback) {
        jmonkey.addQ(function(cb) {
          jmonkey.number = jmonkey.number + number;
          setTimeout(function() {
            callback();
            cb();
          }, 100);
        });
        return jmonkey;
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
        }), function(err, results) {});
      }
    };
    return jmonkey;
  };

  module.exports = Jmonkey;

}).call(this);
