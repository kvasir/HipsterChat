'use strict';
const app = require('app');
const fs = require('fs');
const path = require('path');
const ipc = require('ipc');
const BrowserWindow = require('browser-window');
const Menu = require('menu');
const appMenu = require('./menu');

// report crashes to the Electron project
require('crash-reporter').start();

// adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')();

let windows = [];
let settingsWindow = null;

function createTeamWindow(team) {
	const win = new BrowserWindow({
		'min-width': 800,
		'min-height': 600,
		'web-preferences': {
			'partition': team,
			'plugins': false,

			// fails without this because of CommonJS script detection
			'node-integration': false
		}
	});

	win.loadUrl('https://' + team + '.hipchat.com');
	win.webContents.on('did-finish-load', () => {
		win.setTitle(team);
	});

	return win;
}

function createSettingsWindow() {
	settingsWindow = new BrowserWindow({
		title: app.getName(),
		width: 400,
		height: 300,
		show: false,
		frame: false
	});

	settingsWindow.loadUrl('file://' + path.join(__dirname, 'settings.html'));
	settingsWindow.on('closed', function () {
		settingsWindow = null;
	});

	return settingsWindow;
}

function openAllTeamWindows(settings) {
	settings.teams.forEach(function(team, index){
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
		teams: ['www'],
		showSettings: true
	};

	fs.access(settingsFile, fs.F_OK, function (err) {
		// Create settings file if it doesn't exist.
		if (err) {
			fs.writeFileSync(settingsFile, JSON.stringify(settings), 'utf8');
		} else {
			let file = fs.readFileSync(settingsFile, 'utf8');
			settings = JSON.parse(file);
		}

		openAllTeamWindows(settings);

		settingsWindow = createSettingsWindow();
		settingsWindow.webContents.on('did-finish-load', function() {
			settingsWindow.webContents.send('settings-message', settings);
		});

		if(settings.showSettings)
			settingsWindow.show();

		ipc.on('show-settings', function () {
			settingsWindow.show();
		});

		ipc.on('settings-save', function (event, newSettings) {
			settings.teams = newSettings.teams.filter(Boolean);
			settings.showSettings = newSettings.showSettings;
			fs.writeFileSync(settingsFile, JSON.stringify(settings), 'utf8');

			// Close all windows, and open them again. Not super clean but...
			settingsWindow.hide();
			windows.forEach(function (w) {
				w.close();
			});
			windows = [];
			openAllTeamWindows(settings);
		});
	});
});
