module.exports = {
	setup: () => {
	},
	getFrameBounds: (info) => {
		const minimumSizeFrame = 300
		const minimumSize = 10
		const fullSizeFrame = 465

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
