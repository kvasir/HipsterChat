'use strict';

// Electron doesn't support notifications in Windows yet. https://github.com/atom/electron/issues/262
// So we hijack the Notification API.
require('electron-notification-shim')();

const ipc = require('ipc');
ipc.on('debug-msg', msg => {
	console.info(`We're working on getting a Settings menu working. In the meantime you can edit your settings file manually: ${msg.userSettingsPath}`);
	console.info('Current settings:', msg.userSettings);
});
