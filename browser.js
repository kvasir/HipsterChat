var ipc = require('ipc');
//Redirect call to index.js
ipc.on('show-settings', function(){
	ipc.send('show-settings-window');
});
