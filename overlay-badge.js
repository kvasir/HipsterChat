'use strict';

// Badge code from https://gist.github.com/johnthedebs/c22a04fcd08e598e69b8
// The design matches OSX a bit and is a great ponyfill for Win32 badges.
// Useful for Electron apps.
module.exports.create = function (text) {
	// Falsy values wouldn't make good badges.
	text = text || '';

	// Create badge
	const canvas = document.createElement('canvas');
	canvas.height = 140;
	canvas.width = 140;
	const ctx = canvas.getContext('2d');
	ctx.fillStyle = 'red';
	ctx.beginPath();
	ctx.ellipse(70, 70, 70, 70, 0, 0, 2 * Math.PI);
	ctx.fill();
	ctx.textAlign = 'center';
	ctx.fillStyle = 'white';

	if (text.length > 2) {
		ctx.font = 'bold 65px "Segoe UI", sans-serif';
		ctx.fillText(text, 70, 95);
	} else if (text.length > 1) {
		ctx.font = 'bold 85px "Segoe UI", sans-serif';
		ctx.fillText(text, 70, 100);
	} else {
		ctx.font = 'bold 100px "Segoe UI", sans-serif';
		ctx.fillText(text, 70, 105);
	}

	return canvas.toDataURL();
};
