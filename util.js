// please only put things here that will be used by *multiple* modes, so as not to clutter the file too much.

const util = require('util')
// These could be arguments, as well. They could also be taken via user input with readline.
const delta = 1

// In case audio level readouts throw an "-inf"
// this will make it Javascript's negative infinity.
// dont export this (yet), we dont need it anywhere except getAudioLevelMap currently
const resolveNumber = (n) => (isNaN(Number(n)) ? Number.NEGATIVE_INFINITY : Number(n))

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
	return intermediateMap.map((v) => ({ percentMax: highest.dBs / v.dBs, ...v }))
}

// Color
const Color = {
	Reset: '\x1b[0m',
	Bright: '\x1b[1m',
	Dim: '\x1b[2m',
	Underscore: '\x1b[4m',
	Blink: '\x1b[5m',
	Reverse: '\x1b[7m',
	Hidden: '\x1b[8m',

	FgBlack: '\x1b[30m',
	FgRed: '\x1b[31m',
	FgGreen: '\x1b[32m',
	FgYellow: '\x1b[33m',
	FgBlue: '\x1b[34m',
	FgMagenta: '\x1b[35m',
	FgCyan: '\x1b[36m',
	FgWhite: '\x1b[37m',

	BgBlack: '\x1b[40m',
	BgRed: '\x1b[41m',
	BgGreen: '\x1b[42m',
	BgYellow: '\x1b[43m',
	BgBlue: '\x1b[44m',
	BgMagenta: '\x1b[45m',
	BgCyan: '\x1b[46m',
	BgWhite: '\x1b[47m',
}
const WARN = `\n${Color.FgYellow}[WARNING] %s${Color.Reset}`
const ERROR = `\n${Color.FgRed}[ERROR] %s${Color.Reset}`
const orgConsoleWarn = console.warn
const orgConsoleError = console.error
console.warn = (m) => orgConsoleWarn(WARN, m)
console.error = (m) => orgConsoleError(ERROR, m)


module.exports = {delta, getAudioLevelMap}
