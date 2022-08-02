const util = require('../util.js')
module.exports = {
	setup: () => {},
	getFrameBounds: (info) => ({
		height: info.frame === 0 ? info.maxHeight : Math.floor(Math.abs(Math.cos((info.frame / (info.framerate / util.bouncesPerSecond)) * Math.PI) * (info.maxHeight - util.delta))) + util.delta,
	}),
}
