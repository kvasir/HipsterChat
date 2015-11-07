'use strict';
console.log('browser-win32.js loaded');

// Electron doesn't support notifications in Windows yet. https://github.com/atom/electron/issues/262
// So we hijack the Notification API.
require('./electron-notification-shim.js')();
