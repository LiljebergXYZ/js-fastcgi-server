// HTTP Context
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const config = require('./config.js');
const JssParser = require('./jssparser.js');
const querystring = require('querystring');
const multiparty = require('multiparty');

var HttpContext = function (req, res, mainCallback) {
	this.self = this;
	this.session = null; //new HttpSession
	this.request = { query: '', post: { form: [], files: [], isMultiPart: false }};
	this.response = {};
	this.scripts = [];
	this.require = require;
	this.util = require('util');
	var postData = '';
	var rootPath = req.cgiParams.DOCUMENT_ROOT;
	var vmContext = null;

	// Process and parse all params
	// To their proper variable
	var processParams = function() {
		for (var k in req.cgiParams){
			if (typeof req.cgiParams[k] !== 'function') {
				if(k.startsWith('HTTP_')) {
					if(typeof(this.request.headers) === 'undefined') {
						this.request.headers = {};
					}
					this.request.headers[k.substring(5).toLowerCase()] = req.cgiParams[k];
				} else if(k !== 'QUERY_STRING') {
					if(typeof(this.request.server) === 'undefined') {
						this.request.server = {};
					}
					this.request.server[k.toLowerCase()] = req.cgiParams[k];
				}
			}
		}

		// Easy access of method and protocol
		this.request.method = this.request.server.request_method;
		this.request.httpVersion = this.request.server.server_protocol;

		// Set the content headers properly
		this.request.headers.content_type = (this.request.server.hasOwnProperty('content_type') ? this.request.server.content_type : '');
		this.request.headers.content_length = (this.request.server.hasOwnProperty('content_length') ? this.request.server.content_length : 0);

		// Is the request multipart?
		this.request.post.isMultiPart = (this.request.headers.content_type.toLowerCase().indexOf('multipart/form-data') > -1);

		// Time to parse cookies
		parseCookies();
		// Time to parse query/post
		parseQueryPost();
	}

	var parseQueryPost = function() {
		if(req.method === 'GET') {
			this.request.query = querystring.parse(req.cgiParams.QUERY_STRING);
			mainCallback(self);
		} else if (req.method == 'POST' && !this.request.post.isMultiPart) {
			req.on('data', function (chunk) {
				postData += chunk;
				if (postData.length > 1e6) {
					req.connection.destroy();
				}
			});
			req.on('end', function () {
				self.request.post.form = querystring.parse(postData);
				mainCallback(self);
			});
		} else if(this.request.post.isMultiPart) {
			var form = new multiparty.Form();
			form.parse(req, function(err, fields, files) {
				self.request.post.form = fields;
				for(var key in files) {
					delete files[key][0]['fieldName'];
					if(files[key].length == 1) {
						files[key] = files[key][0];
					}
				}
				self.request.post.files = files;
				mainCallback(self);
			});
		}
	}

	var parseCookies = function() {
		var cookieList = {},
		cookies = req.headers.cookie;

		cookies && cookies.split(';').forEach(function( cookie ) {
			var parts = cookie.split('=');
			cookieList[parts[0].trim()] = decodeURI(parts.slice(1).join('='));
		});

		this.request.cookies = cookieList;
	}

	var init = function() {
		processParams();
	}

	// Replicates PHP's header function
	this.header = function(header) {
		res.setHeader(header.substring(0, header.indexOf(':')), header.substring(header.indexOf(':')+1).trim());
	}

	// Replicates PHP's var_dump
	this.var_dump = function(obj) {
		this.write(JSON.stringify(obj));
	}

	// A more failsafe response.write for use by scripts
	this.write = function(str) {
		if(typeof(str) !== 'string' && typeof(str) !== 'undefined') {
			str = str.toString(); // Attempt to convert to a string
		}
		if(typeof(str) !== 'undefined') {
			res.write(str);
		} else {
			res.write('str is undefined');
		}
	};

	this.isset = function(obj) {
		if(typeof(obj) !== 'undefined') {
			return true;
		}
		return false;
	}

	// Include and run a script in the http sandbox
	this.include = function(filePath, options, callback) {
		if (options === undefined || options === null) options = {encoding: 'utf8'};
		var scriptPath = mapPath(filePath);

		var content = fs.readFileSync(scriptPath, options);

		if (config.ScriptExtensions.indexOf(path.extname(filePath)) !== -1) {
			script = JssParser.parseScript(scripts.length, content);
		} else if(config.EmbededScriptExtensions.indexOf(path.extname(filePath)) !== -1) {
			script = JssParser.parseScript(scripts.length, content);
		}

		scripts.push(script);

		if (vmContext === null) {
			vmContext = vm.createContext(self);
		}

		vm.runInContext(script.code, vmContext, scriptPath);
		if(callback) {
			callback(true);
		}
	};

	// Map a file to the current working path
	this.mapPath = function(filePath) {
		return path.resolve(rootPath, filePath);
	}

	init();

	// This should be everything we need
	return {
		include: include
	}
}

module.exports = HttpContext;