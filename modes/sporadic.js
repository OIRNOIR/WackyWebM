'use strict'

module.exports = {
	setup: () => {},
	getFrameBounds: (info) => ({
		width: info.frame === 0 ? info.maxWidth : Math.floor(Math.random() * info.maxWidth),
		height: info.frame === 0 ? info.maxHeight : Math.floor(Math.random() * info.maxHeight),
	}),
}
