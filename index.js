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
let mainWindow;

function onClosed() {
	// dereference the window
	// for multiple windows store them in an array
	mainWindow = null;
}

function createMainWindow() {
	const win = new BrowserWindow({
		width: 800,
		height: 600,
		'web-preferences': {
			// fails without this because of CommonJS script detection
			'node-integration': false
		}
	});

	win.loadUrl('https://crusader.hipchat.com/chat/');
	win.on('closed', onClosed);

	return win;
}

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate-with-no-open-windows', () => {
	if (!mainWindow) {
		mainWindow = createMainWindow();
	}
});

app.on('ready', () => {
	const settingsFile = path.join(app.getPath('userData'), 'settings.json');

	let settings = {
		teams: []
	};

	fs.access(settingsFile, fs.F_OK, function (err) {
		// Create settings file if it doesn't exist.
		if (err) {
			fs.writeFileSync(settingsFile, JSON.stringify(settings), 'utf8');
		} else {
			let file = fs.readFileSync(settingsFile, 'utf8');
			settings = JSON.parse(file);
		}

		mainWindow = createMainWindow();
	});
});
