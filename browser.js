var ipc = require('ipc');
ipc.on('show-settings', function(){
	ipc.send('show-setting');
});
