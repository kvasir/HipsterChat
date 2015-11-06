'use strict';
const app = require('app');
const fs = require('fs');
const path = require('path');
const BrowserWindow = require('browser-window');
const Menu = require('menu');
const Tray = require('tray');
const shell = require('shell');
const ipc = require('ipc');
const appMenu = require('./menu');

// report crashes to the Electron project
require('crash-reporter').start();

// adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')();

const windows = [];
let tray;
let lastActiveWindow;

function showBalloon(title, content) {
	if (tray) {
		tray.displayBalloon({
			title,
			content
		});
	}
}

function createTeamWindow(team) {
	const win = new BrowserWindow({
		'min-width': 750,
		'min-height': 250,
		'width': 800,
		'height': 600,
		'web-preferences': {
			'partition': team,
			'plugins': false,

			'preload': path.join(__dirname, 'browser.js'),

			// fails without this because of CommonJS script detection
			'node-integration': false,

			// required for Hipchat page title updates
			'web-security': false
		}
	});

	win.loadUrl(`https://${team}.hipchat.com/chat`);
	win.webContents.on('new-window', (e, url) => {
		e.preventDefault();
		shell.openExternal(url);
	});
	win.webContents.on('did-finish-load', () => {
		if (team !== 'www') {
			win.setTitle(team);
		}
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

	const settingsFile = path.join(app.getPath('userData'), 'settings.json');
	console.info(`We're working on getting a Settings menu working. In the meantime you can edit your settings file manually: ${settingsFile}`);

	// Default settings
	let settings = {
		teams: ['www'],
		win32: {
			balloons: true
		}
	};

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

		// Electron doesn't support notifications in Windows yet. https://github.com/atom/electron/issues/262
		if (process.platform === 'win32' &&
		    (settings.win32.balloons || settings.win32.notificationBoxes)) {
			tray = new Tray(path.join(__dirname, 'media/Icon.png'));
			tray.setToolTip('HipsterChat notifications');

			tray.on('balloon-clicked', () => {
				lastActiveWindow.focus();
			});

			ipc.on('notification-shim', (e, msg) => {
				const win = BrowserWindow.fromWebContents(e.sender);
				if (win.isFocused()) {
					return;
				}

				if (settings.win32.balloons) {
					showBalloon(msg.title, msg.options.body);
				}

				// Doesn't seem possible to pass extra info to balloon, and we want this window to open when the balloon is clicked.
				lastActiveWindow = win;
			});
		}
	});
});
