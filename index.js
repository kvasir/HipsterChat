'use strict';
const app = require('app');
const fs = require('fs');
const path = require('path');
const BrowserWindow = require('browser-window');
const Menu = require('menu');
const shell = require('shell');
const ipc = require('ipc');
const NativeImage = require('native-image');
const appMenu = require('./menu');

// report crashes to the Electron project
require('crash-reporter').start();

// adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')();

const badge = NativeImage.createFromPath(path.join(__dirname, 'media/dot.png'));
const settingsFile = path.join(app.getPath('userData'), 'settings.json');

const windows = [];

// Default settings
let settings = {
	teams: ['www'],
	darwin: {
		badge: true,
		bounce: true
	},
	win32: {
		badge: true
	}
};

function bounceIcon() {
	if (process.platform !== 'darwin' || !settings.darwin.bounce) {
		return;
	}

	app.dock.bounce();
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

		ipc.on('notification-shim', e => {
			const win = BrowserWindow.fromWebContents(e.sender);
			if (win.isFocused()) {
				return;
			}

			showBadge(win);
			bounceIcon();
		});
	});
});
