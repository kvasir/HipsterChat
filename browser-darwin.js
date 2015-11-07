'use strict';
console.log('browser-darwin.js loaded');

const ipc = require('ipc');
const remote = require('remote');
const app = remote.require('app');

let notificationCounter = 0;

function removeBadge() {
	notificationCounter = 0;
	app.dock.setBadge('');
}

function setBadge() {
	const text = notificationCounter.toString();
	// TODO: This isn't great, because there's only one app.dock but we can have multiple rendereres running.
	app.dock.setBadge(text);
}

// Electron doesn't support notifications in Windows yet. https://github.com/atom/electron/issues/262
// So we hijack the Notification API.
const OldNotification = Notification;

Notification = function (title, options) {
	const notification = new OldNotification(title, options);

	ipc.send('notification-shim', {
		title,
		options
	});

	notificationCounter++;
	setBadge(notificationCounter);

	return notification;
};
Notification.prototype = OldNotification.prototype;
Notification.permission = OldNotification.permission;
Notification.requestPermission = OldNotification.requestPermission;

ipc.on('reset-notifications', () => removeBadge());
