'use strict';
const os = require('os');
const app = require('app');
const Menu = require('menu');
const shell = require('shell');
const BrowserWindow = require('browser-window');
const appName = app.getName();

function sendAction(action) {
	const win = BrowserWindow.getAllWindows()[0];

	if (process.platform === 'darwin') {
		win.restore();
	}
	win.webContents.send(action);
}

const darwinTpl = [
	{
		label: appName,
		submenu: [
			{
				label: `About ${appName}`,
				role: 'about'
			},
			{
				type: 'separator'
			},
			{
				label: 'Preferences...',
				accelerator: 'CmdOrCtrl+,',
				click() {
					sendAction('show-settings');
				}
			},
			{
				type: 'separator'
			},
			{
				label: `Quit ${appName}`,
				accelerator: 'Cmd+Q',
				click() {
					app.quit();
				}
			}
		]
	},
	{
		label: 'Edit',
		submenu: [
			{label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:'},
			{label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:'},
			{type: 'separator'},
			{label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:'},
			{label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:'},
			{label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:'},
			{label: 'Select All', accelerator: 'CmdOrCtrl+A', selector: 'selectAll:'}
		]
	},
	{
		label: 'Window',
		role: 'window',
		submenu: [
			{
				label: 'Minimize',
				accelerator: 'CmdOrCtrl+M',
				role: 'minimize'
			},
			{
				label: 'Close',
				accelerator: 'CmdOrCtrl+W',
				role: 'close'
			},
			{
				type: 'separator'
			},
			{
				label: 'Bring All to Front',
				role: 'front'
			}
		]
	},
	{
		label: 'Help',
		role: 'help'
	}
];

const linuxTpl = [
	{
		label: 'Help',
		role: 'help'
	}
];

const helpSubmenu = [
	{
		label: `${appName} Website...`,
		click() {
			shell.openExternal('https://github.com/kvasir/hipsterchat');
		}
	},
	{
		label: 'Report an Issue...',
		click() {
			const body = `
**Please succinctly describe your issue and steps to reproduce it.**

-

${app.getName()} ${app.getVersion()}
${process.platform} ${process.arch} ${os.release()}`;

			shell.openExternal(`https://github.com/kvasir/hipsterchat/issues/new?body=${encodeURIComponent(body)}`);
		}
	}
];

let tpl;
if (process.platform === 'darwin') {
	tpl = darwinTpl;
} else {
	tpl = linuxTpl;
}

tpl[tpl.length - 1].submenu = helpSubmenu;

module.exports = Menu.buildFromTemplate(tpl);
