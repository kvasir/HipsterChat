'use strict';
const app = require('app');
const fs = require('fs');
const path = require('path');
const BrowserWindow = require('browser-window');

// report crashes to the Electron project
require('crash-reporter').start();

// adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')();


// prevent window being garbage collected
var windows = [];

function onClosed() {
	// dereference the window
	// for multiple windows store them in an array
	windows.forEach(function(window){
		window = null;
	});
}

function createWindow(provider, i) {
	const win = new BrowserWindow({
		title: app.getName(),
		'min-width': 800,
		'min-height': 600,
		'web-preferences': {
			// fails without this because of CommonJS script detection
			'node-integration': false
		}
	});

	win.loadUrl('https://' + provider);
	win.on('closed', onClosed);

	return win;
}

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('ready', () => {
	const settingsFile = path.join(app.getPath('userData'), 'settings.json');

	let settings = {
		teams: ['google.se','google.se']
	};

	fs.access(settingsFile, fs.F_OK, function (err) {
		// Create settings file if it doesn't exist.
		if (err) {
			fs.writeFileSync(settingsFile, JSON.stringify(settings), 'utf8');
		} else {
			let file = fs.readFileSync(settingsFile, 'utf8');
			settings = JSON.parse(file);
		}

		settings.teams.forEach(function(team, index){
			windows.push(createWindow(team, index));
		});
	});
});
