'use strict';
const app = require('app');
const fs = require('fs');
const path = require('path');
const BrowserWindow = require('browser-window');
const Menu = require('menu');
const appMenu = require('./menu');
const shell = require('shell');
const ipc = require('ipc');
// report crashes to the Electron project
require('crash-reporter').start();

// adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')();

let windows = [];
let settingsWindow;

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
			'node-integration': false
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
function createSettingsWindow(settings) {
	settingsWindow = new BrowserWindow({
		title: app.getName(),
		width: 400,
		height: 300,
		show: false,
		frame: false
	});

	settingsWindow.loadUrl(`file://${__dirname}/settings.html`);

	settingsWindow.webContents.on('did-finish-load', () => {
		settingsWindow.webContents.send('settings-message', settings);
	});
	return settingsWindow;
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

	ipc.on('show-settings-window', () => {
		settingsWindow.show();
	});

	ipc.on('cancel-settings', () => {
		settingsWindow.hide();
		settingsWindow = createSettingsWindow(settings);
	});

	fs.access(settingsFile, fs.F_OK, err => {
		// Create settings file if it doesn't exist.
		if (err) {
			fs.writeFileSync(settingsFile, JSON.stringify(settings), 'utf8');
		} else {
			const file = fs.readFileSync(settingsFile, 'utf8');
			settings = JSON.parse(file);
		}

		openAllTeamWindows(settings);

		settingsWindow = createSettingsWindow(settings);

		ipc.on('settings-save', (event, newSettings) => {
			settings.teams = newSettings.teams.filter(Boolean);
			fs.writeFileSync(settingsFile, JSON.stringify(settings), 'utf8');

			// Close all windows, and open them again. Not super clean but...

			settingsWindow.hide();
			windows.forEach(w => {
				w.close();
			});
			windows = [];
			openAllTeamWindows(settings);
		});
	});
});
