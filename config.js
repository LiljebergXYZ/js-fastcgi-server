module.exports = {
	Version: '0.1',

	openTag: '<?js',
	closeTag: '?>',

	ScriptExtensions: ['.js'],

	EmbededScriptExtensions: ['.jss'],

	SessionCookie: 'JS-FASTCGI-SESSIONID',
	SessionTimeOut: 15*60, // Default is 15 minutes
};