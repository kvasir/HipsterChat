module.exports = function (grunt) {
	grunt.loadNpmTasks('grunt-electron-installer');

	grunt.initConfig({
		'create-windows-installer': {
			x64: {
				appDirectory: '/dist/HipsterChat-win32-x64',
				outputDirectory: '/dist/HipsterChat-win32-x64-installer',
				authors: 'Kvasir',
				owners: 'Kvasir',
				exe: 'HipsterChat.exe'
			},
			ia32: {
				appDirectory: '/dist/HipsterChat-win32-ia32',
				outputDirectory: '/dist/HipsterChat-win32-ia32-installer',
				authors: 'Kvasir',
				owners: 'Kvasir',
				exe: 'HipsterChat.exe'
			}
		}
	});

	grunt.registerTask('default', ['create-windows-installer']);
};
