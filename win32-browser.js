'use strict';
console.log('browser.js');

// Electron doesn't support notifications in Windows yet. https://github.com/atom/electron/issues/262
const ipc = require('ipc');
const parseString = require('xml2js').parseString;

const OldXHR = window.XMLHttpRequest;

function getUsername(hipchatFromField) {
	return hipchatFromField.split('/')[1];
}

function newXHR() {
	const realXHR = new OldXHR();

	realXHR.addEventListener('load', e => {
		if (!e.target.responseText) {
			return;
		}

		parseString(e.target.responseText, (err, result) => {
			if (err) {
				return console.error(`Hipchat message parsing error: ${err}`);
			}

			if (!result.body || !result.body.message || !result.body.message[0].body) {
				return console.warn(`Hipchat message empty ${result}`);
			}

			result.body.message.forEach(m => {
				const msg = {
					from: getUsername(m.$.from),
					messages: m.body
				};

				console.log(`from ${msg.from}, nr messages ${msg.messages.length} `);

				ipc.send('hipchat-message', msg);
			});
		});
	});

	return realXHR;
}
newXHR.prototype = OldXHR.prototype;

window.XMLHttpRequest = newXHR;
