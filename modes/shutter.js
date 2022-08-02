const util = require('../util.js')
module.exports = {
	setup: () => {},
	getFrameBounds: (info) => ({
		width: info.frame === 0 ? info.maxWidth : Math.floor(Math.abs(Math.cos((info.frame / (info.frameRate / util.bouncesPerSecond)) * Math.PI) * (info.maxWidth - util.delta))) + util.delta,
	}),
}
