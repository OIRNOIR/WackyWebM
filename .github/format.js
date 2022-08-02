const fs = require('fs')
const { modes } = require('../wackywebm')

if (!modes || modes.length < 1) return console.error('No modes found')

fs.readFile(require.resolve('../run.sh'), 'utf8', function (err, data) {
	let re = new RegExp('read -p "Mode (.+): " mode', 'gi')
	let formatted = data.replace(re, 'read -p "Mode (' + modes.join(', ') + '): " mode')

	fs.writeFile(require.resolve('../run.sh'), formatted, 'utf8', function (err) {
		if (err) return console.log(err)
	})
})

fs.readFile(require.resolve('../run.bat'), 'utf8', function (err, data) {
	let re = new RegExp('set /p "mode=Mode (.+): "', 'gi')
	let formatted = data.replace(re, 'set /p "mode=Mode (' + modes.join(', ') + '): "')

	fs.writeFile(require.resolve('../run.bat'), formatted, 'utf8', function (err) {
		if (err) return console.log(err)
	})
})
