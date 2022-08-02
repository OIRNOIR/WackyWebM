module.exports = {
	setup: () => {},
	getFrameBounds: (info) => {
		let height = info.maxHeight
		let width = info.maxWidth
		if (info.frame > 2) {
			
			height = 1
			width = 1
		}
		return { width, height }
	},
}