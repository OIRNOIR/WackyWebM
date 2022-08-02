const util = require('../util.js')
let audioMap
let audioMapL
module.exports = {
	setup: async info => {
		audioMap = await util.getAudioLevelMap(info.videoPath)
		audioMapL = audioMap.length - 1
	},
	getFrameBounds: (info) => {
		const { percentMax } = audioMap[Math.max(Math.min(Math.floor((info.frame / (info.frameCount - 1)) * audioMapL), audioMapL), 0)]
		return {
			height: info.frame === 0 ? info.maxHeight : Math.max(Math.floor(Math.abs(info.maxHeight * percentMax)), util.delta),
		}
	},
}
