// JssParser
var config = require('./config.js');
var util = require('util');

var parseScript = function(id, content) {
	var writeBase = 'write(%s);';
	var writeScriptBase = util.format(writeBase, 'scripts[%d].content[%d]');

	var script = { code: '', content: [] };

	var startIndex = 0;
	var endIndex = 0;

	while(endIndex < content.length) {
		endIndex = content.indexOf(config.openTag, startIndex);

		if(endIndex >= 0) {
			if(endIndex > startIndex) {
				script.code += util.format(writeScriptBase, id, script.content.length);
				script.content.push(content.slice(startIndex, endIndex));
			}

			startIndex = endIndex + config.openTag.length;

			var echoTag = (content[startIndex] == '=') ? startIndex++ : -1;
			endIndex = content.indexOf(config.closeTag, startIndex);

			if(endIndex >= 0) {
				if(echoTag > 0) {
					script.code += util.format(writeBase, content.slice(startIndex, endIndex));
				} else {
					script.code += content.slice(startIndex, endIndex);
					if(!script.code.endsWith(';')) {
						script.code += ';'; // Add semicolon to end the code
					}
				}
				startIndex = endIndex + config.closeTag.length;
			} else {
				throw new Error('Missing closing tag ' + config.closeTag + ' on line ' + findLine(startIndex, content) );
			}
		} else {
			endIndex = content.length;
			
			// Add a write call to the source code referencing the content array.
			script.code += util.format(writeScriptBase, id, script.content.length);
			script.content.push(content.slice(startIndex, endIndex));
		}
	}

	return script;
}

const NEW_LINE_LENGTH = 2;
var findLine = function(index, content) {
	var lineIndex = 0;
	var line = 0;

	while(lineIndex < index) {
		if(lineIndex >= index) {
			lineIndex = index;
			break;
		}
		lineIndex = content.indexOf('\n', lineIndex) + NEW_LINE_LENGTH;
		line++;
	}
	return line;
}

module.exports = {
	parseScript: parseScript
}