const util = require('../util.js')
module.exports = {
	setup: () => {},
	getFrameBounds: (info) => ({
		width: info.frame === 0 ? info.maxWidth : Math.floor(Math.random() * (info.maxWidth - util.delta)) + util.delta,
		height: info.frame === 0 ? info.maxHeight : Math.floor(Math.random() * (info.maxHeight - util.delta)) + util.delta,
	}),
}
