'use strict';
const app = require('app');
const fs = require('fs');
const path = require('path');
const BrowserWindow = require('browser-window');
const Menu = require('menu');
const Tray = require('tray');
const shell = require('shell');
const ipc = require('ipc');
const WindowsToaster = require('node-notifier/notifiers/toaster');
const NativeImage = require('native-image');
const appMenu = require('./menu');

// report crashes to the Electron project
require('crash-reporter').start();

// adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')();

const badge = NativeImage.createFromPath(path.join(__dirname, 'media/dot.png'));
const iconPath = path.join(__dirname, 'media/Icon.png');
const settingsFile = path.join(app.getPath('userData'), 'settings.json');

const windows = [];
let tray;
let lastActiveWindow;

// Default settings
let settings = {
	teams: ['www'],
	darwin: {
		badge: true,
		bounce: true
	},
	win32: {
		badge: true,
		balloons: false,
		notificationBoxes: true,
		notificationSound: true
	}
};

function showBalloon(title, content) {
	if (process.platform !== 'win32' || !settings.win32.balloons) {
		return;
	}

	tray.displayBalloon({
		title,
		content
	});
}

function bounceIcon() {
	if (process.platform !== 'darwin' || !settings.darwin.bounce) {
		return;
	}

	app.dock.bounce();
}

function showToast(win, title, content) {
	// We only want to use node-notifier for Windows, when the user wants it.
	// TODO: Instead of a separate setting for it, check if we can use Notification.permission so it works like other platforms.
	if (process.platform !== 'win32' || !settings.win32.notificationBoxes) {
		return;
	}

	// TODO: WindowsToaster can take a fallback option, to use balloons if toaster isn't available. Consider it, since it would make our code easier.
	const notifier = new WindowsToaster();
	const message = {
		title,
		message: content,
		icon: iconPath,
		sound: settings.win32.notificationSound,
		wait: true
	};

	notifier.notify(message);
	notifier.on('click', () => win.focus());
}

function showBadge(win) {
	if (process.platform === 'darwin' && settings.darwin.badge) {
		app.dock.setBadge(' ');
	} else if (process.platform === 'win32' && settings.win32.badge) {
		win.setOverlayIcon(badge, 'You have unread messages');
	}
}

function hideBadge(win) {
	if (process.platform === 'darwin' && settings.darwin.badge) {
		app.dock.setBadge('');
	} else if (process.platform === 'win32' && settings.win32.badge) {
		win.setOverlayIcon(null, '');
	}
}

function createTeamWindow(team) {
	const win = new BrowserWindow({
		'min-width': 750,
		'min-height': 250,
		'width': 800,
		'height': 600,
		'web-preferences': {
			'partition': `persist:${team}`,
			'plugins': false,

			'preload': path.join(__dirname, 'browser.js'),

			// fails without this because of CommonJS script detection
			'node-integration': false,

			// required for Hipchat page title updates
			'web-security': false
		}
	});

	win.loadURL(`https://${team}.hipchat.com/chat`);
	win.on('focus', () => hideBadge(win));
	win.webContents.on('new-window', (e, url) => {
		e.preventDefault();
		shell.openExternal(url);
	});
	win.webContents.on('did-finish-load', () => {
		if (team !== 'www') {
			win.setTitle(team);
		}

		win.webContents.send('debug-msg', {
			userSettingsPath: settingsFile,
			userSettings: settings
		});
	});

	return win;
}

function openAllTeamWindows(settings) {
	settings.teams.forEach((team, index) => {
		windows.push(createTeamWindow(team, index));
	});
	lastActiveWindow = windows[windows.length - 1];
}

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('ready', () => {
	Menu.setApplicationMenu(appMenu);

	fs.access(settingsFile, fs.F_OK, err => {
		// Create settings file if it doesn't exist.
		if (!err) {
			// Extend the settings object and save it, so we can add new settings in newer versions without issues.
			// TODO: Need to clean out old settings variables somehow.
			const file = fs.readFileSync(settingsFile, 'utf8');
			settings = Object.assign(settings, JSON.parse(file));
		}
		// After merging settings, save it down again.
		fs.writeFileSync(settingsFile, JSON.stringify(settings), 'utf8');

		console.log('Settings used:');
		console.dir(settings);

		openAllTeamWindows(settings);

		ipc.on('notification-shim', (e, msg) => {
			const win = BrowserWindow.fromWebContents(e.sender);
			if (win.isFocused()) {
				return;
			}

			const content = msg.options.body || '';
			showBalloon(msg.title, content);
			showToast(win, msg.title, content);
			showBadge(win);
			bounceIcon();

			// Doesn't seem possible to pass extra info to balloon, and we want this window to open when the balloon is clicked.
			lastActiveWindow = win;
		});

		// Electron doesn't support notifications in Windows yet. https://github.com/atom/electron/issues/262
		// So we create our own Windows notification visualizations.
		if (process.platform === 'win32') {
			if (settings.win32.balloons) {
				tray = new Tray(iconPath);
				tray.setToolTip('HipsterChat notifications');
				tray.on('balloon-clicked', e => {
					console.log(e);
					lastActiveWindow.focus();
				});
			}
		}
	});
});
