module.exports = {
	setup: () => {},
	getFrameBounds: (info) => {
		let height = Math.max(1, Math.floor(info.maxHeight - (info.index / (info.frameRate / 10)) * Math.PI))
		let width = Math.max(1, Math.floor(info.maxWidth - (info.index / (info.frameRate / 10)) * Math.PI))
		if (info.frame > 466) {
			//change 466 to the specific frame you want to become full size
			height = info.maxHeight
			width = info.maxWidth
		}
	},
}
