'use strict'

/*
Make WebM files with changing aspect ratios
By OIRNOIR#0032
*/

const path = require('path')
const fs = require('fs')
// Synchronous execution via promisify.
const util = require('util')
// I'll admit, inconvenient naming here.
const ourUtil = require('./util')
const execSync = util.promisify(require('child_process').exec)
const getFileName = (p) => path.basename(p, path.extname(p))

const modes = {}
for (const modeFile of fs.readdirSync(`${__dirname}/modes/`).filter(file => file.endsWith('.js'))) {
	modes[modeFile.split('.')[0]] = require(`${__dirname}/modes/${modeFile}`)
}
module.exports = { modes }

const type = { w: undefined }
let videoPath = '',
	outputPath = undefined,
	keyFrameFile = undefined,
	bitrate = undefined,
	tempo = undefined,
	compression = undefined;

for (let i = 2; i < process.argv.length; i++) {
	const arg = process.argv[i]

	// named arguments
	//
	// output file
	if (arg === '-o' || arg === '--output') {
		// no argument after "-o" 			  || not the first "-o" argument
		if (i === process.argv.length - 1 || outputPath !== undefined) {
			return displayUsage()
		}
		// consume the next argument, so we dont iterate over it again
		outputPath = process.argv[++i]
		continue
	}
	// keyframe file
	if (arg === '-k' || arg === '--keyframes') {
		// no argument after "-k" 			  || not the first "-k" argument
		if (i === process.argv.length - 1 || keyFrameFile !== undefined) {
			return displayUsage()
		}
		keyFrameFile = process.argv[++i]
		continue
	}
	// customizable bitrate
	if (arg === '-b' || arg === '--bitrate') {
		// no argument after "-b" 			  || not the first "-b" argument
		if (i === process.argv.length - 1 || bitrate !== undefined) {
			return displayUsage()
		}
		bitrate = process.argv[++i]
		continue
	}
	// customizable bouncesPerSecond (hereinafter known as Tempo)
	if (arg === '-t' || arg === '--tempo') {
		// no argument after "-t" 			  || not the first "-t" argument
		if (i === process.argv.length - 1 || tempo !== undefined) {
			return displayUsage()
		}
		tempo = process.argv[++i]
		continue
	}
	// level of compression
	if (arg === '-c' || arg === '--compression') {
		if (i === process.argv.length - 1 || compression !== undefined) {
			return displayUsage()
		}
		compression = parseInt(process.argv[++i]);
		continue
	}

	// positional arguments
	//
	// basically, first positional argument is inputType, second one
	// (and every one after that) is video path, except when the first one doesn't
	// match any of the input types, in which case its also part of the path.
	// split by + before trying to match to modes in order to support using multiple modes.
	if (
		type.w === undefined &&
		arg.split(/\+/g).every((x) =>
			Object.keys(modes)
				.map((m) => m.toLowerCase())
				.includes(x.toLowerCase())
		)
	) {
		type.w = arg.toLowerCase()
	} else {
		if (type.w === undefined) type.w = 'Bounce'
		videoPath += arg + ' '
	}
}

// not a single positional argument; we need at least 1
if (type.w === undefined) return displayUsage()

// Keyframes mode selected without providing keyframe file
if (type.w === 'Keyframes' && (keyFrameFile === undefined || !fs.existsSync(keyFrameFile))) return displayUsage()

// got 1 positional argument, which was the mode to use - no file path!
if (videoPath === '') return displayUsage()

// we always append 1 extra space, so remove the last one.
videoPath = videoPath.substring(0, videoPath.length - 1)

// Default bitrate: 1M
if (bitrate === undefined) bitrate = '1M'
if (tempo === undefined) tempo = 2
if (compression === undefined) compression = 0;

const fileName = getFileName(videoPath),
	filePath = path.dirname(videoPath)

// no "-o" argument, use default path in the format "chungus_Bounce.webm"
if (outputPath === undefined) outputPath = path.join(filePath, `${fileName}_${type.w.replace(/\+/g, '_')}.webm`)

// Build an index of temporary locations so they do not need to be repeatedly rebuilt.
// All temporary files are within one parent folder for cleanliness and ease of removal.
const workLocations = {}

function buildLocations() {
	// maybe use `os.tmpdir()` instead of the cwd?
	workLocations.tempFolder = path.join(__dirname, 'tempFiles')
	workLocations.tempAudio = path.join(workLocations.tempFolder, 'tempAudio.webm')
	//workLocations.tempVideo = path.join(workLocations.tempFolder, 'tempVideo.webm')
	workLocations.tempConcatList = path.join(workLocations.tempFolder, 'tempConcatList.txt')
	workLocations.tempFrames = path.join(workLocations.tempFolder, 'tempFrames')
	workLocations.tempFrameFiles = path.join(workLocations.tempFrames, '%d.png')
	workLocations.tempResizedFrames = path.join(workLocations.tempFolder, 'tempResizedFrames')
	workLocations.outputFile = outputPath
}

function displayUsage() {
	const Usage =
		'WackyWebM by OIRNOIR#0032\n' +
		'Usage: node wackywebm.js [-o output_file_path] [optional_type] [-k keyframe_file] <input_file>\n' +
		'\t-c,--compression: change compression level (higher is more compressed, 0 is lossless)\n' +
		'\t-o,--output: change output file path (needs the desired output path as an argument)\n' +
		'\t-k,--keyframes: only required with the type set to "Keyframes", sets the path to the keyframe file\n' +
		'\t-b,--bitrate: change the bitrate used to encode the file (Default is 1 MB/s)\n' +
		'\t-t,--tempo: change the bounces per second on "Bounce" and "Shutter" modes\n\n' +
		'Recognized Modes:\n' +
		Object.keys(modes)
			.map((m) => `\t${m}`)
			.join('\n')
			.toLowerCase() +
		'\nIf no mode is specified, "Bounce" is used.'
	console.log(Usage)
}

async function main() {
	// Verify the given path is accessible.
	if (!videoPath || !fs.existsSync(videoPath)) return displayUsage()

	// Only build the path if temporary location index if the code can move forward. Less to do.
	buildLocations()

	// Use one call to ffprobe to obtain framerate, width, and height, returned as JSON.
	console.log(`Input file: ${videoPath}\nUsing minimum w/h ${ourUtil.delta}px${type.w.includes('Bounce') || type.w.includes('Shutter') ? ` and bounce speed of ${tempo} per second.` : ''}.\nExtracting necessary input file info...`)
	const videoInfo = await execSync(`ffprobe -v error -select_streams v -of json -show_entries stream=r_frame_rate,width,height "${videoPath}"`, { maxBuffer: 1024 * 1000 * 8 /* 8mb */ })
	// Deconstructor extracts these values and renames them.
	let {
		streams: [{ width: maxWidth, height: maxHeight, r_frame_rate: framerate }],
	} = JSON.parse(videoInfo.stdout.trim())
	maxWidth = Number(maxWidth)
	maxHeight = Number(maxHeight)
	const decimalFramerate = framerate.includes('/') ? Number(framerate.split('/')[0]) / Number(framerate.split('/')[1]) : Number(framerate)

	// Make folder tree using NodeJS promised mkdir with recursive enabled.
	console.log(`Resolution is ${maxWidth}x${maxHeight}.\nFramerate is ${framerate} (${decimalFramerate}).\nCreating temporary directories...`)

	await fs.promises.mkdir(workLocations.tempFrames, { recursive: true })
	await fs.promises.mkdir(workLocations.tempResizedFrames, { recursive: true })

	// Separates the audio to be re-applied at the end of the process.
	console.log('Splitting audio into a temporary file...')
	// If the file has no audio, flag it to it is not attempted.
	let audioFlag = true
	try {
		await execSync(`ffmpeg -y -i "${videoPath}" -vn -c:a libvorbis "${workLocations.tempAudio}"`, { maxBuffer: 1024 * 1000 * 8 /* 8mb */ })
	} catch {
		console.log('No audio detected.')
		audioFlag = false
	}

	// Extracts the frames to be modified for the wackiness.
	console.log('Splitting file into frames...')
	await execSync(`ffmpeg -y -i "${videoPath}" "${workLocations.tempFrameFiles}"`, { maxBuffer: 1024 * 1000 * 8 /* 8mb */ })

	// Sorts with a map so extraction of information only happens once per entry.
	const tempFramesFiles = fs.readdirSync(workLocations.tempFrames)
	const tempFramesFrames = tempFramesFiles
		.filter((f) => f.endsWith('png'))
		.map((f) => ({ file: f, n: Number(getFileName(f)) }))
		.sort((a, b) => a.n - b.n)
	// Index tracked from outside. Width and/or height initialize as the maximum and are not modified if unchanged.
	let index = 0,
		lines = [],
		length = tempFramesFrames.length

	if (/\+/.test(type.w)) {
		type.w = type.w.split(/\+/g)
	} else {
		type.w = [type.w]
	}

	const setupInfo = {
		videoPath,
		keyFrameFile,
		maxWidth,
		maxHeight,
		frameCount: length,
		frameRate: decimalFramerate,
	}

	for (const modeToSetUp of type.w)
		if (modes[modeToSetUp].setup.constructor.name === 'AsyncFunction') await modes[modeToSetUp].setup(setupInfo)
		else modes[modeToSetUp].setup(setupInfo)

	process.stdout.write(`Converting frames to webm (File ${index}/${tempFramesFrames.length})...`)

	let lastWidth = -1, lastHeight = -1, sameSizeCount = 0;

	for (const { file } of tempFramesFrames) {
		// Makes the height/width changes based on the selected type.

		const infoObject = {
			frame: index,
			maxWidth: maxWidth,
			maxHeight: maxHeight,
			frameCount: length,
			frameRate: decimalFramerate,
			tempo: tempo
		}

		const frameBounds = {}
		for (const mode of type.w) {
			const current = modes[mode].getFrameBounds(infoObject)
			if (current.width !== undefined) frameBounds.width = current.width
			if (current.height !== undefined) frameBounds.height = current.height
		}

		if (frameBounds.width === undefined) frameBounds.width = maxWidth
		if (frameBounds.height === undefined) frameBounds.height = maxHeight

		// bit hacky but whatever...
		if (index === 0)
		{
			lastWidth = frameBounds.width;
			lastHeight = frameBounds.height;
		}

		// we "save" either when the difference in frame size is too large (as defined by the compression parameter), or when we reached the end of the video.
		if (Math.abs(frameBounds.width - lastWidth) + Math.abs(frameBounds.height - lastHeight) > compression || index === length - 1) {
			console.log(`Saved Chunk from ${index - sameSizeCount} to ${index} (length ${sameSizeCount})`);
			console.log(`Size: ${frameBounds.width}x${frameBounds.height} (${lastWidth}x${lastHeight})`);
			await execSync(`ffmpeg -y -start_number ${index - sameSizeCount + 1} -i "${path.join(workLocations.tempFrames, "%d.png")}" -frames:v ${sameSizeCount} -c:v vp8 -b:v ${bitrate} -crf 10 -vf scale=${lastWidth}x${lastHeight} -aspect ${lastWidth}:${lastHeight} -r ${framerate} -f webm "${path.join(workLocations.tempResizedFrames, file + '.webm')}"`, { maxBuffer: 1024 * 1000 * 8 /* 8mb */ })
			lines.push(`file '${path.join(workLocations.tempResizedFrames, file + '.webm')}'`)
			sameSizeCount = 1;
			lastWidth = frameBounds.width;
			lastHeight = frameBounds.height;
		}else {
			sameSizeCount++;
		}

		// Tracks the new file for concatenation later.
		index++
		process.stdout.clearLine()
		process.stdout.cursorTo(0)
		process.stdout.write(`Converting frames to webm (File ${index}/${length})...`)
	}
	process.stdout.write('\n')

	// Writes the concatenation file for the next step.
	console.log('Writing concat file...')
	await fs.promises.writeFile(workLocations.tempConcatList, lines.join('\n'))

	// Concatenates the resized files.
	//console.log('Combining webm files into a single webm...')
	//await execSync(`ffmpeg -y -f concat -safe 0 -i "${workLocations.tempConcatList}" -c copy "${workLocations.tempVideo}"`)

	// Applies the audio to the new file to form the final file.
	//console.log('Applying audio to create final webm file...')
	//await execSync(`ffmpeg -y -i "${workLocations.tempVideo}" -i "${workLocations.tempAudio}" -c copy "${path.join(filePath, `${fileName}_${inputType}.webm`)}"`)

	// Congatenates segments and applies te original audio to the new file.
	console.log(`Concatenating segments${audioFlag ? ' and applying audio ' : ' '}for final webm file...`)
	//if(audioFlag) await execSync(`ffmpeg -y -f concat -safe 0 -i "${workLocations.tempConcatList}" -i "${workLocations.tempAudio}" -c copy "${workLocations.outputFile}"`)
	//else await execSync(`ffmpeg -y -f concat -safe 0 -i "${workLocations.tempConcatList}" -c copy "${workLocations.outputFile}"`)
	await execSync(`ffmpeg -y -f concat -safe 0 -i "${workLocations.tempConcatList}"${audioFlag ? ` -i "${workLocations.tempAudio}" ` : ' '}-c copy "${workLocations.outputFile}"`, { maxBuffer: 1024 * 1000 * 8 /* 8mb */ })

	// Recursive removal of temporary files via the main temporary folder.
	console.log('Done!\nRemoving temporary files...')
	await fs.promises.rm(workLocations.tempFolder, { recursive: true })
}
void main()
