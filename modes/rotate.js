'use strict'

const util = require('../util.js')

let orgWidth,
	orgHeight,
	rotateAngle = 0

module.exports = {
	setup: (info) => {
		orgWidth = info.maxWidth
		orgHeight = info.maxHeight
	},
	getFrameBounds: (info) => {
		if (info.frame === 0) {
			const maxSize = Math.floor(info.maxWidth * Math.abs(Math.cos(Math.PI / 4)) + info.maxHeight * Math.abs(Math.sin(Math.PI / 4)))
			return {
				width: maxSize,
				height: maxSize,
			}
		}

		rotateAngle += info.angle / info.frameRate
		const angle = rotateAngle * (Math.PI / 180)
		const width = Math.floor(Math.max(orgWidth, orgWidth * Math.abs(Math.cos(angle)) + orgHeight * Math.abs(Math.sin(angle))))
		const height = Math.floor(Math.max(orgHeight, orgWidth * Math.abs(Math.sin(angle)) + orgHeight * Math.abs(Math.cos(angle))))

		return {
			width: width,
			height: height,
			command: `-vf "pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1,rotate=${angle}:bilinear=0"`,
		}
	},
}
