'use strict';

// Electron doesn't support notifications in Windows yet. https://github.com/atom/electron/issues/262
// So we hijack the Notification API.'
const ipc = require('ipc');

module.exports = () => {
	const OldNotification = Notification;

	Notification = function (title, options) {
		const eventData = {
			title,
			options
		};

		// Send this to main thread.
		// Catch it in your main 'app' instance with `ipc.on`.
		ipc.send('notification-shim', eventData);

		// Send this within the view.
		// Catch it in your views with `document.addEventListener`.
		document.dispatchEvent(new CustomEvent('notification-shim', eventData));

		// Send the native Notification.
		// You can't catch it, that's why we're doing all of this. :)
		return new OldNotification(title, options);
	};

	Notification.prototype = OldNotification.prototype;
	Notification.permission = OldNotification.permission;
	Notification.requestPermission = OldNotification.requestPermission;
};
