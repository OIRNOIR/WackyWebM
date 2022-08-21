'use strict'

const util = require('../util.js')
const fs = require('fs')
const UPNG = require('upng-js')

// all of these "find edge" functions are a little repetitive, but i can't think of a way to generalise them that
// does not involve passing endless lambdas around, which I don't think would help readability any more than just having
// 4 similar functions. possible todo?
function getLeftEdge(threshold, info) {
	for (let x = 0; x < info.maxWidth; x++) {
		for (let y = 0; y < info.maxHeight; y++) {
			if ((info.frameData[util.getPixelIndexFromCoords(x, y, info.maxWidth)] >>> 24) > threshold)
				return x
		}
	}
	// there is not 1 opaque pixel in the whole image (wtf?); but we don't want the result to be 0x0 so we (somewhat arbitrarily)
	// chose the upper left corner to be the one pixel we include in the frame.
	return 0
}

function getRightEdge(threshold, info, left) {
	for (let x = info.maxWidth - 1; x >= left; x--) {
		for (let y = 0; y < info.maxHeight; y++) {
			if ((info.frameData[util.getPixelIndexFromCoords(x, y, info.maxWidth)] >>> 24) > threshold)
				return x
		}
	}
	return 0
}

function getTopEdge(threshold, info) {
	for (let y = 0; y < info.maxHeight; y++) {
		for (let x = 0; x < info.maxWidth; x++) {
			if ((info.frameData[util.getPixelIndexFromCoords(x, y, info.maxWidth)] >>> 24) > threshold)
				return y
		}
	}
	return 0
}

function getBottomEdge(threshold, info, top) {
	for (let y = info.maxHeight - 1; y >= top; y--) {
		for (let x = 0; x < info.maxWidth; x++) {
			if ((info.frameData[util.getPixelIndexFromCoords(x, y, info.maxWidth)] >>> 24) > threshold)
				return y
		}
	}
	return 0
}

module.exports = {
	requiresFrameData: true,
	setup: () => {},
	getFrameBounds: (info) => {
		const leftEdge = getLeftEdge(info.transparencyThreshold, info)
		const rightEdge = getRightEdge(info.transparencyThreshold, info, leftEdge)
		const topEdge = getTopEdge(info.transparencyThreshold, info)
		const bottomEdge = getBottomEdge(info.transparencyThreshold, info, topEdge)

		const width = rightEdge - leftEdge + 1
		const height = bottomEdge - topEdge + 1

		const outputBuf = new ArrayBuffer(width * height * 4)
		const view = new Int32Array(outputBuf)
		for (let y = topEdge; y <= bottomEdge; y++) {
			for (let x = leftEdge; x <= rightEdge; x++) {
				const originalPxIx = util.getPixelIndexFromCoords(x, y, info.maxWidth)
				const newPxIx = util.getPixelIndexFromCoords(x - leftEdge, y - topEdge, width)
				view[newPxIx] = info.frameData[originalPxIx]
			}
		}
		fs.writeFileSync(info.frameFilePath, new Uint8Array(UPNG.encode([outputBuf], width, height, 0)))
		return {
			width, height
		}
	},
}
