var jade = require('jade');
var fs = require('fs');
var filewalker = require('filewalker');
var _ = require('lodash');

module.exports = function(obj){
	var jmonkey = this
	jmonkey.src= obj.src_dir if obj.src?

	return jmonkey
}