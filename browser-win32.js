'use strict';
console.log('browser-win32.js loaded');

// Electron doesn't support notifications in Windows yet. https://github.com/atom/electron/issues/262
// So we hijack the Notification API.
const ipc = require('ipc');
const OldNotification = Notification;

Notification = function (title, options) {
	const notification = new OldNotification(title, options);
	ipc.send('notification-shim', {
		title,
		options
	});

	return notification;
};
Notification.prototype = OldNotification.prototype;
