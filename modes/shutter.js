'use strict'

const util = require('../util.js')
module.exports = {
	setup: () => {},
	getFrameBounds: (info) => ({
		width: info.frame === 0 ? info.maxWidth : Math.floor(Math.abs(Math.cos((info.frame / (info.frameRate / info.tempo)) * Math.PI) * (info.maxWidth - util.delta))) + util.delta,
	}),
}
