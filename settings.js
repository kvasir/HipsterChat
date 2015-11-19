(function () {
	'use strict';
	const ipc = require('ipc');
	const list = document.getElementsByClassName('teams')[0];
	const settingsCheckbox = document.getElementsByClassName('show-settings-on-start')[0];

	const saveButton = document.getElementsByClassName('save-settings')[0];
	saveButton.addEventListener('click', () => {
		const teamNames = document.getElementsByClassName('team-name');
		const teams = [];

		for (let i = 0; i < teamNames.length; i++) {
			teams.push(teamNames[i].value);
		}
		const settings = {
			teams,
			showSettings: settingsCheckbox.checked
		};
		ipc.send('settings-save', settings);
	});

	const addButton = document.getElementsByClassName('add-team')[0];
	addButton.addEventListener('click', () => {
		list.appendChild(createTeamItem(''));
	});

	const cancelButton = document.getElementsByClassName('cancel-settings')[0];
	cancelButton.addEventListener('click', () => {
		ipc.send('cancel-settings');
	});

	function createTeamItem(value) {
		const item = document.createElement('div');
		item.className = 'form-group';
		const input = document.createElement('input');
		input.type = 'text';
		input.value = value;
		input.className = 'team-name form-control';
		item.appendChild(input);

		return item;
	}

	ipc.on('settings-message', settings => {
		settings.teams.forEach(team => {
			list.appendChild(createTeamItem(team));
		});
		if (settings.showSettings) {
			settingsCheckbox.checked = true;
		}
	});
})();
