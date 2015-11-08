'use strict';
const app = require('app');
const fs = require('fs');
const path = require('path');
const BrowserWindow = require('browser-window');
const Menu = require('menu');
const appMenu = require('./menu');
const shell = require('shell');

// report crashes to the Electron project
require('crash-reporter').start();

// adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')();

const windows = [];

// Handle auto-updates
var handleStartupEvent = function() {
	if (process.platform !== 'win32') {
		return false;
	}

	var squirrelCommand = process.argv[1];
	switch (squirrelCommand) {
		case '--squirrel-install':
		case '--squirrel-updated':

			// Optionally do things such as:
			//
			// - Install desktop and start menu shortcuts
			// - Add your .exe to the PATH
			// - Write to the registry for things like file associations and
			//	 explorer context menus

			// Always quit when done
			app.quit();

			return true;
		case '--squirrel-uninstall':
			// Undo anything you did in the --squirrel-install and
			// --squirrel-updated handlers

			// Always quit when done
			app.quit();

			return true;
		case '--squirrel-obsolete':
			// This is called on the outgoing version of your app before
			// we update to the new version - it's the opposite of
			// --squirrel-updated
			app.quit();
			return true;
	}
};

if (handleStartupEvent()) {
	return;
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
	});
});
