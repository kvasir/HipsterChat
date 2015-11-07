'use strict';
console.log('browser.js loaded');

if (process.platform === 'win32') {
	require('./browser-win32.js');
}
if (process.platform === 'darwin') {
	require('./browser-darwin.js');
}

const ipc = require('ipc');
ipc.on('debug-msg', msg => {
	console.info(`We're working on getting a Settings menu working. In the meantime you can edit your settings file manually: ${msg.userSettingsPath}`);
	console.info('Current settings:', msg.userSettings);
});
