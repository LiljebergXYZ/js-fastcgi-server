const fcgi = require('node-fastcgi');
const fs = require('fs');
const config = require('./config.js');
const JssParser = require('./jssparser.js');
const path = require('path');
var HttpContext = require('./http_context.js')

fcgi.createServer(function(req, res) {
	// Create our HTTP Context
	// The callback ensures that all query/post data has been parsed and can be used
	HttpContext(req, res, function(context) {
		var filePath = req.cgiParams.SCRIPT_FILENAME;
		// Set default statuscode to 200
		res.statusCode = 200;
		// Set default content-type to HTML
		res.setHeader('Content-Type', 'text/html');
		try{
			// Include the original script referred to by the webserver
			context.include(filePath, null, function(data) {
				res.end();
			});
		} catch(ex) {
			console.log(ex);
			res.write(ex.toString());
			res.end();
		}
	});
}).listen(process.env.PORT || 9001, process.env.IP || '127.0.0.1');