'use strict';
console.log('browser.js loaded');

if (process.platform === 'win32') {
	require('./win32-browser.js');
}
