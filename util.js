'use strict'

// please only put things here that will be used by *multiple* modes, so as not to clutter the file too much.

const util = require('util')
const path = require('path')
const { localizeString } = require('./localization.js')

function findMinimumNonErrorSize(width, height) {
	const getGcd = (a, b) => b ? getGcd(b, a % b) : a

	const av_reduce_succeeds = (num, den) => {
		const max = 255

		let a0 = [0, 1]
		let a1 = [1, 0]
		const gcd = getGcd(num, den)

		if (gcd !== 0) {
			num = Math.floor(num / gcd)
			den = Math.floor(den / gcd)
		}

		if (num <= max && den <= max) {
			a1 = [num, den]
			den = 0
		}

		while (den !== 0) {
			let x = Math.floor(num / den)
			let next_den = num - den * x
			let a2n = x * a1[0] + a0[0]
			let a2d = x * a1[1] + a0[1]

			if (a2n > max || a2d > max) {
				if (a1[0] !== 0)
					x = Math.floor((max - a0[0]) / a1[0])
				if (a1[1] !== 0)
					x = Math.min(x, Math.floor((max - a0[1]) / a1[1]))

				if (den * (2 * x * a1[1] + a0[1]) > num * a1[1])
					a1 = [x * a1[0] + a0[0], x * a1[1] + a0[1]]
				break
			}

			a0 = a1
			a1 = [a2n, a2d]
			num = den
			den = next_den
		}

		return getGcd(a1[0], a1[1]) <= 1 && (a1[0] <= max && a1[1] <= max) && a1[0] > 0 && a1[1] > 0
	}

	// *very* suboptimal, but this function only runs once, and even 1000 iterations are pretty fast, so whatever...
	for (let i = 1; i <= Math.max(width, height); i++) {
		if (av_reduce_succeeds(i, height) && av_reduce_succeeds(width, i)) {
			return i
		}
	}
}

// In case audio level readouts throw an "-inf"
// this will make it Javascript's negative infinity.
// dont export this (yet), we dont need it anywhere except getAudioLevelMap currently
//const resolveNumber = (n) => (isNaN(Number(n)) ? Number.NEGATIVE_INFINITY : Number(n))
const resolveNumber = (n, d = Number.NEGATIVE_INFINITY) => isFinite(n) ? Number(n) : d

const execSync = util.promisify(require('child_process').exec)
// Obtains a map of the audio levels in decibels from the input file.
async function getAudioLevelMap(videoPath) {
	// The method requires escaping the file path.
	// Modify this regular expression if more are necessary.
	const escapePathRegex = /([\\/:])/g
	const { frames: rawAudioData } = JSON.parse((await execSync(`ffprobe -f lavfi -i "amovie='${videoPath.replace(escapePathRegex, '\\$1')}',astats=metadata=1:reset=1" -show_entries "frame=pkt_pts_time:frame_tags=lavfi.astats.Overall.RMS_level" -of json`, { maxBuffer: 1024 * 1000 * 8 /* 8mb */ })).stdout)
	// Remap to simplify the format.
	const intermediateMap = rawAudioData.map(({ tags: { 'lavfi.astats.Overall.RMS_level': dBs } }, i) => ({ frame: Number(i + 1), dBs: resolveNumber(dBs) }))
	// Obtain the highest audio level from the file.
	const highest = intermediateMap.reduce((previous, current) => (previous.dBs > current.dBs ? previous : current))
	//return intermediateMap.map(v => ({ percentMax: 1 - (highest.dBs / v.dBs), ...v })) // Shrink when louder.
	// Amend percentages of the audio per frame vs. the highest in the file.
	//return intermediateMap.map((v) => ({ percentMax: highest.dBs / v.dBs, ...v }))

	// Obtain the average audio level of the file.
	const average = intermediateMap.reduce((previous, current) => previous + resolveNumber(current.dBs, 0), 0) / intermediateMap.length
	// Calculate the deviation.
	const deviation = Math.abs((highest.dBs - average) / 2)
	// Calculate and amend percentage of decimals from across the video.
	for (const frame of intermediateMap) {
		const clamped = Math.max(Math.min(frame.dBs, average + deviation), average - deviation)
		const v = Math.abs((clamped - average) / deviation) * 0.5
		frame.percentMax = clamped > average ? (0.5 + v) : (0.5 - v)
	}
	return intermediateMap
}

const getFileName = (p) => path.basename(p, path.extname(p))

function getPixelIndexFromCoords(x, y, w) {
	return y * w + x
}

// these are lambdas so that their value updates as locale changes.
// this is bad for performance, but we don't call warn or error nearly often enough for it to be a big problem.
const WARN = () => `\n${localizeString('warning_template')}\n`
const ERROR = () => `\n${localizeString('error_template')}\n`
const orgConsoleWarn = console.warn
const orgConsoleError = console.error
console.warn = (m) => orgConsoleWarn(WARN(), m)
console.error = (m) => orgConsoleError(ERROR(), m)

module.exports = { getAudioLevelMap, getFileName, findMinimumNonErrorSize, getPixelIndexFromCoords }
