'use strict';
console.log('browser-win32.js loaded');

const overlayBadge = require('./overlay-badge.js');
const ipc = require('ipc');
const remote = require('remote');
const NativeImage = remote.require('native-image');
const app = remote.require('app');
const mainWindow = remote.getCurrentWindow();

// Electron doesn't support notifications in Windows yet. https://github.com/atom/electron/issues/262
// So we hijack the Notification API.
const OldNotification = Notification;
let notificationCounter = 0;

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

ipc.on('reset-notifications', () => removeBadge());

function removeBadge() {
	notificationCounter = 0;
	mainWindow.setOverlayIcon(null, '');
}

function setBadge() {
	let text = notificationCounter.toString();
	if (process.platform === 'darwin') {
		app.dock.setBadge(text);
	} else if (process.platform === 'win32') {
		if (text === '') {
			mainWindow.setOverlayIcon(null, '');
			return;
		}

		// Create badge
		const canvas = document.createElement('canvas');
		canvas.height = 140;
		canvas.width = 140;
		const ctx = canvas.getContext('2d');
		ctx.fillStyle = 'red';
		ctx.beginPath();
		ctx.ellipse(70, 70, 70, 70, 0, 0, 2 * Math.PI);
		ctx.fill();
		ctx.textAlign = 'center';
		ctx.fillStyle = 'white';

		if (text.length > 2) {
			ctx.font = 'bold 65px "Segoe UI", sans-serif';
			ctx.fillText(text, 70, 95);
		} else if (text.length > 1) {
			ctx.font = 'bold 85px "Segoe UI", sans-serif';
			ctx.fillText(text, 70, 100);
		} else {
			ctx.font = 'bold 100px "Segoe UI", sans-serif';
			ctx.fillText(text, 70, 105);
		}

		const badgeDataURL = overlayBadge.create(text);
		const img = NativeImage.createFromDataUrl(badgeDataURL);

		mainWindow.setOverlayIcon(img, text);
	}
}
