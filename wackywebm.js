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
const modesDir = path.join(__dirname, 'modes')
for (const modeFile of fs.readdirSync(modesDir).filter((file) => file.endsWith('.js'))) {
	try {
		modes[modeFile.split('.')[0]] = require(path.join(modesDir, modeFile))
	} catch (e) {
		console.warn(`mode: ${modeFile.split('.')[0]} load failed`)
	}
}

const type = { w: undefined }
let videoPath = undefined,
	fileName = undefined,
	filePath = undefined,
	outputPath = undefined,
	keyFrameFile = undefined,
	bitrate = undefined,
	maxThread = undefined,
	tempo = undefined,
	angle = undefined,
	compressionLevel = undefined

// NOTE! if you add a new option, please check out if anything needs to be added for it into terminal-ui.js
const argsConfig = [
	{
		keys: ['-h', '--help'],
		noValueAfter: true,
		call: () => {
			displayUsage()
			process.exit(1)
		},
		description: 'displays this syntax guide',
	},
	{
		keys: ['-k', '--keyframes'],
		call: (val) => (keyFrameFile = val),
		getValue: () => keyFrameFile,
		description: "only used with 'Keyframes' mode; sets the keyframe file to use",
	},
	{
		keys: ['-b', '--bitrate'],
		// Default bitrate: 1M
		default: () => (bitrate = '1M'),
		call: (val) => (bitrate = val),
		getValue: () => bitrate,
		description: 'sets the maximum bitrate of the video. Lowering this might reduce file size.',
	},
	{
		keys: ['--thread'],
		default: () => (maxThread = 2),
		call: (val) => (maxThread = parseInt(val)),
		getValue: () => maxThread,
		description: 'sets maximum allowed number of threads to use',
	},
	{
		keys: ['-t', '--tempo'],
		default: () => (tempo = 2),
		call: (val) => (tempo = val),
		getValue: () => tempo,
		description: 'regulates speed of bouncing',
	},
	{
		keys: ['-a', '--angle'],
		default: () => (angle = 360),
		call: (val) => (angle = parseInt(val)),
		getValue: () => angle,
		description: "angle to rotate per second when using 'Rotate' mode",
	},
	{
		keys: ['-o', '--output'],
		// no "-o" argument, use default path in the format "chungus_Bounce.webm"
		default: () => (outputPath = path.join(filePath, `${fileName}_${type.w.replace(/\+/g, '_')}.webm`)),
		call: (val) => (outputPath = val),
		getValue: () => outputPath,
		description: 'sets output file.',
	},
	{
		keys: ['-c', '--compression'],
		default: () => (compressionLevel = 0),
		call: (c) => (compressionLevel = c),
		getValue: () => compressionLevel,
		description: 'sets compression level (higher value means more compression)',
	},
]

function parseCommandArguments() {
	for (let i = 2; i < process.argv.length; i++) {
		const arg = process.argv[i]

		// named arguments
		if (arg.startsWith('-')) {
			let argFound = false
			for (const j of argsConfig) {
				if (j.keys.includes(arg)) {
					// need vale but no argument after || set argument value twice
					if ((!j.noValueAfter && i === process.argv.length - 1) || (j.getValue && j.getValue() !== undefined)) {
						console.error(`Illegal argument: ${arg}`)
						return displayUsage()
					}
					j.call(++i === process.argv.length ? null : process.argv[i])
					argFound = true
					break
				}
			}
			if (!argFound) {
				console.error(`Argument "${arg}" cant be set`)
				return displayUsage()
			}
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
			if (videoPath) videoPath += ' ' + arg
			else videoPath = arg
		}
	}

	// not a single positional argument, we need at least 1
	if (type.w === undefined) {
		type.w = 'bounce'
		console.warn(`Mode not selected, using default "${type.w}".`)
	}
	// Keyframes mode selected without providing keyframe file
	if (type.w === 'keyframes' && (keyFrameFile === undefined || !fs.existsSync(keyFrameFile))) {
		if (keyFrameFile) console.error(`Keyframes file not found. "${keyFrameFile}"`)
		else console.error(`Keyframes file not given.`)
		return displayUsage()
	}

	// got 1 positional argument, which was the mode to use - no file path!
	if (videoPath === undefined) {
		console.error('Video file not given.')
		return displayUsage()
	}
	fileName = getFileName(videoPath)
	filePath = path.dirname(videoPath)

	// check if value not given, use default
	for (const i of argsConfig) if (i.default && i.getValue() === undefined) i.default()

	return true
}

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
	// for appropriately indenting all the argument aliases so they line up nicely
	const longestKeys = argsConfig.map((a) => a.keys.join(',')).sort((a, b) => b.length - a.length)[0].length
	const Usage =
		'WackyWebM by OIRNOIR#0032\n' +
		'Usage: node wackywebm.js [-o output_file_path] [optional_type] [-k keyframe_file] <input_file>\n' +
		argsConfig.map((arg) => `\t${(arg.keys.join(',') + ':').padEnd(longestKeys + 1, ' ')}  ${arg.description}`).join('\n') +
		'\nRecognized Modes:\n' +
		Object.keys(modes)
			.map((m) => `\t${m}`)
			.join('\n')
			.toLowerCase() +
		'\nIf no mode is specified, "Bounce" is used.'
	console.log(Usage)
}

function ffmpegErrorHandler(e) {
	console.error(
		e.message
			.split('\n')
			.filter((m) => !m.startsWith('  configuration:'))
			.join('\n')
	)
}

async function main(selectedModes, videoPath, keyFrameFile, bitrate, maxThread, tempo, angle, compressionLevel, outputFile) {
	// Verify the given path is accessible.
	if (!videoPath || !fs.existsSync(videoPath)) {
		if (videoPath) console.error(`Video file not found. "${videoPath}"`)
		else console.error(`Video file not given.`)
		return displayUsage()
	}

	// Only build the path if temporary location index if the code can move forward. Less to do.
	buildLocations()

	// Use one call to ffprobe to obtain framerate, width, and height, returned as JSON.
	console.log(`\
Input file: ${videoPath}.
Using minimum w/h ${ourUtil.delta}px.
Extracting necessary input file info...`)
	const videoInfo = await execSync(`ffprobe -v error -select_streams v -of json -count_frames -show_entries stream=r_frame_rate,width,height,nb_read_frames "${videoPath}"`, { maxBuffer: 1024 * 1000 * 8 /* 8mb */ })
	// Deconstructor extracts these values and renames them.
	let {
		streams: [{ width: maxWidth, height: maxHeight, r_frame_rate: framerate, nb_read_frames: frameCount }],
	} = JSON.parse(videoInfo.stdout.trim())
	maxWidth = Number(maxWidth)
	maxHeight = Number(maxHeight)
	frameCount = Number(frameCount)
	const decimalFramerate = framerate.includes('/') ? Number(framerate.split('/')[0]) / Number(framerate.split('/')[1]) : Number(framerate)

	// Make folder tree using NodeJS promised mkdir with recursive enabled.
	console.log(`\
Resolution is ${maxWidth}x${maxHeight}.
Framerate is ${framerate} (${decimalFramerate}).`)

	// Print config
	console.log(`============Config============`)
	const modeName = selectedModes[0].toUpperCase() + selectedModes.slice(1)
	console.log(`Mode: ${modeName}`)
	if (selectedModes.includes('bounce') || selectedModes.includes('shutter')) console.log(`Bounce speed: ${tempo} times per second`)
	else if (selectedModes.includes('rotate')) console.log(`Rotating speed: ${angle} deg per second`)
	console.log(`==============================`)

	// Create temp folder
	console.log('Creating temporary directories...')
	await fs.promises.mkdir(workLocations.tempFrames, { recursive: true })
	await fs.promises.mkdir(workLocations.tempResizedFrames, { recursive: true })

	// Separates the audio to be re-applied at the end of the process.
	console.log('Splitting audio into a temporary file...')
	// If the file has no audio, flag it to it is not attempted.
	let audioFlag = true
	try {
		await execSync(`ffmpeg -y -i "${videoPath}" -vn -c:a libvorbis "${workLocations.tempAudio}"`, { maxBuffer: 1024 * 1000 * 8 /* 8mb */ })
	} catch {
		console.warn('No audio detected.')
		audioFlag = false
	}

	// Extracts the frames to be modified for the wackiness.
	console.log('Splitting file into frames...')
	try {
		await execSync(`ffmpeg -threads ${maxThread} -y -i "${videoPath}" "${workLocations.tempFrameFiles}"`, { maxBuffer: 1024 * 1000 * 8 /* 8mb */ })
	} catch (e) {
		ffmpegErrorHandler(e)
	}
	// Sorts with a map so extraction of information only happens once per entry.
	const tempFramesFiles = fs.readdirSync(workLocations.tempFrames)
	const tempFramesFrames = tempFramesFiles
		.filter((f) => f.endsWith('png'))
		.map((f) => ({ file: f, n: Number(getFileName(f)) }))
		.sort((a, b) => a.n - b.n)
	// Index tracked from outside. Width and/or height initialize as the maximum and are not modified if unchanged.
	let frame = 0,
		tempFiles = []

	// type.w's first character is uppercase, make it lower
	selectedModes = selectedModes.toLowerCase()
	if (/\+/.test(selectedModes)) {
		selectedModes = selectedModes.split(/\+/g)
	} else {
		selectedModes = [selectedModes]
	}

	const setupInfo = {
		videoPath,
		keyFrameFile,
		maxWidth,
		maxHeight,
		frameCount,
		frameRate: decimalFramerate,
	}

	// Setup modes
	for (const modeToSetUp of selectedModes)
		if (modes[modeToSetUp].setup.constructor.name === 'AsyncFunction') await modes[modeToSetUp].setup(setupInfo)
		else modes[modeToSetUp].setup(setupInfo)

	process.stdout.write(`Converting frames to webm (File ${frame}/${frameCount})...`)

	const subProcess = []

	let lastWidth = -1,
		lastHeight = -1,
		sameSizeCount = 0
	let totalFramesDone = 0

	// dont let individual segments (partial webm files) get *too* long (half the file and more, sometimes), otherwise we have almost all threads idling and 1 doing all the work.
	const maxSegmentLength = Math.floor(frameCount / maxThread);

	for (const { file } of tempFramesFrames) {
		// Makes the height/width changes based on the selected type.

		const infoObject = {
			frame: frame,
			maxWidth: maxWidth,
			maxHeight: maxHeight,
			frameCount: frameCount,
			frameRate: decimalFramerate,
			tempo: tempo,
			angle: angle,
		}

		const frameBounds = {}
		for (const mode of selectedModes) {
			const current = modes[mode].getFrameBounds(infoObject)
			if (current.width !== undefined) frameBounds.width = current.width
			if (current.height !== undefined) frameBounds.height = current.height
			if (current.command !== undefined) frameBounds.command = current.command
		}

		if (frameBounds.width === undefined) frameBounds.width = maxWidth
		if (frameBounds.height === undefined) frameBounds.height = maxHeight

		if (frame === 0) {
			lastWidth = frameBounds.width
			lastHeight = frameBounds.height
		}

		if (Math.abs(frameBounds.width - lastWidth) + Math.abs(frameBounds.height - lastHeight) > compressionLevel || frame === frameCount - 1 || sameSizeCount > maxSegmentLength) {
			// Creates the respective resized frame based on the above.
			try {
				// only make new partial webm if frame size changed.
				const outputFileName = path.join(workLocations.tempResizedFrames, file + '.webm')
				const command = `ffmpeg -y -r ${framerate} -start_number ${frame - sameSizeCount + 1} -i "${path.join(workLocations.tempFrames, '%d.png')}" -frames:v ${sameSizeCount} -c:v vp8 -b:v ${bitrate} -crf 10 ${frameBounds.command ?? `-vf scale=${frameBounds.width}x${frameBounds.height} -aspect ${frameBounds.width}:${frameBounds.height}`} -threads 1 -f webm "${outputFileName}"`

				// Wait if subProcess is full
				//TODO: figure out a smarter way to just wait for *any* thread to finish, instead of just the 1st (since the later ones might finish before the 1st in the list)
				if (subProcess.length >= maxThread) {
					// this is a little awkward, but we added the "assignedFrames" attribute to the promise, not the result, so we have to "get it out" before we await.
					const processToAwait = subProcess.shift()
					const doneFrames = processToAwait.assignedFrames
					await processToAwait
					totalFramesDone += doneFrames
				}

				const newProcess = execSync(command, { maxBuffer: 1024 * 1000 * 8 })
				newProcess.assignedFrames = sameSizeCount

				subProcess.push(newProcess)

				tempFiles.push(`file '${path.join(workLocations.tempResizedFrames, file + '.webm')}'`)

				process.stdout.clearLine()
				process.stdout.cursorTo(0)
				process.stdout.write(`Converting ${sameSizeCount.toString().padStart(frameCount.toString().length, ' ')} frames to webm (frames ${frame}-${frame + sameSizeCount - 1} / ${frameCount}) - ${Math.floor((1000 * totalFramesDone) / frameCount) / 10.0}%`)

				sameSizeCount = 1
				lastWidth = frameBounds.width
				lastHeight = frameBounds.height
			} catch (e) {
				ffmpegErrorHandler(e)
				return
			}
		} else {
			sameSizeCount++
		}
		frame++
		if (frame >= frameCount) {
			for (const process of subProcess) await process
			// Clean up
			subProcess.length = 0
			process.stdout.write(`\nSuccessfully converted all frames to webm.`)
			break
		}
	}
	process.stdout.write('\n')

	// Writes the concatenation file for the next step.
	console.log('Writing concat file...')
	await fs.promises.writeFile(workLocations.tempConcatList, tempFiles.join('\n'))

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
	try {
		await execSync(`ffmpeg -y -f concat -safe 0 -i "${workLocations.tempConcatList}"${audioFlag ? ` -i "${workLocations.tempAudio}" ` : ' '}-c copy "${outputFile}"`, { maxBuffer: 1024 * 1000 * 8 /* 8mb */ })
	} catch (e) {
		ffmpegErrorHandler(e)
	}

	// Recursive removal of temporary files via the main temporary folder.
	console.log('Done!\nRemoving temporary files...')
	await fs.promises.rm(workLocations.tempFolder, { recursive: true })
}

module.exports = { modes, main, arguments: argsConfig, run: main }

// recommended way to check if this file is the entry point, as per
// https://nodejs.org/api/deprecations.html#DEP0144
if (require.main !== module) return

if (parseCommandArguments() !== true) return

// we're ignoring a promise (the one returned by main) here. this is by design and not harmful, so ignore the warning
// noinspection JSIgnoredPromiseFromCall
main(type.w, videoPath, keyFrameFile, bitrate, maxThread, tempo, angle, compressionLevel)
