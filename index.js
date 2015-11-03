'use strict';
const app = require('app');
const fs = require('fs');
const path = require('path');
const BrowserWindow = require('browser-window');
const Menu = require('menu');
const Tray = require('tray');
const shell = require('shell');
const appMenu = require('./menu');

// report crashes to the Electron project
require('crash-reporter').start();

// adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')();

const windows = [];

function updateBadge(title) {
	const messageCount = (/\(([0-9]+)\)/).exec(title);
	console.log(messageCount, title);

	if (Tray.displayBalloon) {
		Tray.displayBalloon({
			title: `Title ${messageCount}`,
			content: `Content ${messageCount}`
		});
	}

	if (app.dock) {
		app.dock.setBadge(messageCount ? messageCount[1] : '');
	}
}

function createTeamWindow(team) {
	const win = new BrowserWindow({
		'width': 800,
		'height': 600,
		'web-preferences': {
			//'partition': team,
			'plugins': false,

			// fails without this because of CommonJS script detection
			'node-integration': false
		}
	});

	win.loadUrl(`https://${team}.hipchat.com/chat`);
	win.on('page-title-updated', (e, title) => updateBadge(title));
	win.webContents.on('new-window', (e, url) => {
		e.preventDefault();
		shell.openExternal(url);
	});
	win.webContents.on('did-finish-load', () => {
		if (team !== 'www') {
			//win.setTitle(team);
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
