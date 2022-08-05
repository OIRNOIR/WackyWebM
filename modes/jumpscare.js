module.exports = {
	setup: () => {
	},
	getFrameBounds: (info) => {
		// shrink to minimumSize time (in sec)
		const minimumSizeTime = 10
		// jump to full size time (in sec)
		const fullSizeTime = 15.6
		// minimum width and height
		const minimumSize = 10


		const minimumSizeFrame = minimumSizeTime * info.frameRate
		const fullSizeFrame = fullSizeTime * info.frameRate

		let width, height
		if (info.frame < minimumSizeFrame) {
			width = Math.max(minimumSize, Math.floor(info.maxWidth - info.frame / minimumSizeFrame * (info.maxWidth - minimumSize)))
			height = Math.max(minimumSize, Math.floor(info.maxHeight - info.frame / minimumSizeFrame * (info.maxHeight - minimumSize)))
		} else
			width = height = minimumSize

		if (info.frame > fullSizeFrame) {
			//change 466 to the specific frame you want to become full size
			height = info.maxHeight
			width = info.maxWidth
		}
		return { width, height }
	},
}
