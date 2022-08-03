module.exports = {
	setup: () => {},
	getFrameBounds: (info) => ({
		height: Math.max(1, Math.floor(info.maxHeight - (info.frame / info.frameCount) * info.maxHeight)),
	}),
}
