'use strict';

// Electron doesn't support notifications in Windows yet. https://github.com/atom/electron/issues/262
// So we hijack the Notification API.
const ipc = require('ipc');

module.exports = () => {
	const OldNotification = Notification;

	Notification = function (title, options) {
		ipc.send('notification-shim', {
			title,
			options
		});

		return new OldNotification(title, options);
	};
	Notification.prototype = OldNotification.prototype;
	Notification.permission = OldNotification.permission;
	Notification.requestPermission = OldNotification.requestPermission;
};
