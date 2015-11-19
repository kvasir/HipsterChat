const ipc = require('ipc');

ipc.on('show-settings', () => {
	ipc.send('show-settings-window');
});
