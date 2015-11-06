'use strict';
const app = require('app');
const fs = require('fs');
const path = require('path');
const BrowserWindow = require('browser-window');
const Menu = require('menu');
const Tray = require('tray');
const shell = require('shell');
const ipc = require('ipc');
const notifier = require('node-notifier');
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

	// Default settings
	let settings = {
		teams: ['www']
	};

	fs.access(settingsFile, fs.F_OK, err => {
		// Create settings file if it doesn't exist.
		if (err) {
			fs.writeFileSync(settingsFile, JSON.stringify(settings), 'utf8');
		} else {
			const file = fs.readFileSync(settingsFile, 'utf8');
			settings = JSON.parse(file);
		}

		openAllTeamWindows(settings);

		// Electron doesn't support notifications in Windows yet. https://github.com/atom/electron/issues/262
		if (process.platform === 'win32') {
			tray = new Tray(path.join(__dirname, 'media/Icon.png'));
			tray.setToolTip('HipsterChat notifications');

			tray.on('balloon-clicked', () => {
				lastActiveWindow.focus();
			});
			notifier.on('click', () => {
				lastActiveWindow.focus();
			});

			ipc.on('hipchat-message', (e, msg) => {
				const win = BrowserWindow.fromWebContents(e.sender);
				if (win.isFocused()) {
					return;
				}

				showBalloon(msg.from, msg.messages[msg.messages.length - 1]);
				notifier.notify({
					title: msg.from,
					message: msg.messages[msg.messages.length - 1],
					icon: path.join(__dirname, 'media/Icon.png'), // absolute path (not balloons)
					sound: true, // Only Notification Center or Windows Toasters
					wait: true // wait with callback until user action is taken on notification
				}, function (err, response) {
					// response is response from notification
					console.log('notifier');
					console.log(err);
					console.log(response);
				});

				// Doesn't seem possible to pass extra info to balloon, and we want this window to open when the balloon is clicked.
				lastActiveWindow = win;
			});
		}
	});
});
