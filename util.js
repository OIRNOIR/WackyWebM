// please only put things here that will be used by *multiple* modes, so as not to clutter the file too much.

const util = require('util')
// These could be arguments, as well. They could also be taken via user input with readline.
const delta = 1

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

const WARN = `\n[WARNING] %s\n`
const ERROR = `\n[ERROR] %s\n`
const orgConsoleWarn = console.warn
const orgConsoleError = console.error
console.warn = (m) => orgConsoleWarn(WARN, m)
console.error = (m) => orgConsoleError(ERROR, m)

module.exports = { delta, getAudioLevelMap }
