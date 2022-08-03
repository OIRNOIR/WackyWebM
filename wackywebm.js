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
<<<<<<< HEAD
// This addresses cases where unusable audio levels are returned.
// Adapted from: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/isFinite
const resolveNumber = (n, d = Number.NEGATIVE_INFINITY) => isFinite(n) ? Number(n) : d
=======
>>>>>>> eff9f0ad9e54212769f89d1403d4012683fffafe

const modes = {}
const modesDir = path.join(__dirname, 'modes')
for (const modeFile of fs.readdirSync(modesDir).filter(file => file.endsWith('.js'))) {
	try {
		modes[modeFile.split('.')[0]] = require(path.join(modesDir, modeFile))
	} catch (e) {
		console.warn(`mode: ${modeFile.split('.')[0]} load failed`)
	}
}
module.exports = { modes }

const type = { w: undefined }
let videoPath = undefined,
	fileName = undefined,
	filePath = undefined,
	outputPath = undefined,
	keyFrameFile = undefined,
	bitrate = undefined,
	maxThread = undefined,
	tempo = undefined,
	angle = undefined

const argsConfig = [
	{
		keys: ['-h', '--help'],
		noValueAfter: true,
		call: () => {
			displayUsage()
			process.exit(1)
		}
	},
	{
		keys: ['-k', '--keyframes'],
		call: (val) => keyFrameFile = val, getValue: () => keyFrameFile
	},
	{
		keys: ['-b', '--bitrate'],
		// Default bitrate: 1M
		default: () => bitrate = '1M',
		call: (val) => bitrate = val, getValue: () => bitrate
	},
	{
		keys: ['--thread'],
		default: () => maxThread = 2,
		call: (val) => maxThread = parseInt(val), getValue: () => maxThread
	},
	{
		keys: ['-t', '--tempo'],
		default: () => tempo = 2,
		call: (val) => tempo = val, getValue: () => tempo
	},
	{
		keys: ['-a', '--angle'],
		default: () => angle = 360,
		call: (val) => angle = parseInt(val), getValue: () => angle
	},
	{
		keys: ['-o', '--output'],
		// no "-o" argument, use default path in the format "chungus_Bounce.webm"
		default: () => outputPath = path.join(filePath, `${fileName}_${type.w.replace(/\+/g, '_')}.webm`),
		call: (val) => outputPath = val, getValue: () => outputPath
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
					if (!j.noValueAfter && i === process.argv.length - 1 || (j.getValue && j.getValue() !== undefined)) {
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
		if (type.w === undefined &&
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
		if (keyFrameFile)
			console.error(`Keyframes file not found. "${keyFrameFile}"`)
		else
			console.error(`Keyframes file not given.`)
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
	for (const i of argsConfig)
		if (i.default && i.getValue() === undefined) i.default()

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
	const Usage =
		'WackyWebM by OIRNOIR#0032\n' +
		'Usage: node wackywebm.js [-o output_file_path] [optional_type] [-k keyframe_file] <input_file>\n' +
		'\t-o,--output: change output file path (needs the desired output path as an argument)\n' +
		'\t-k,--keyframes: only required with the type set to "Keyframes", sets the path to the keyframe file\n' +
		'\t-b,--bitrate: change the bitrate used to encode the file (Default is 1 MB/s)\n' +
		'\t-t,--tempo: change the bounces per second on "Bounce" and "Shutter" modes\n' +
		'\t-a,--angle: change the angle rotate per second on "Angle" modes, can be negative\n' +
		'\t--thread: max thread use, default: 2\n' +
		'\nRecognized Modes:\n' +
		Object.keys(modes)
			.map((m) => `\t${m}`)
			.join('\n')
			.toLowerCase() +
		'\nIf no mode is specified, "Bounce" is used.'
	console.log(Usage)
}

<<<<<<< HEAD
function infixToPostfix(expression) {
	let outputQueue = []
	const operatorStack = []
	const operators = {
		'/': {
			precedence: 2,
			associativity: 'Left',
		},
		'*': {
			precedence: 2,
			associativity: 'Left',
		},
		'+': {
			precedence: 1,
			associativity: 'Left',
		},
		'-': {
			precedence: 1,
			associativity: 'Left',
		},
	}
	expression = expression.split(/([+\-*/()])/).filter((s) => s !== '')
	for (let i = 0; i < expression.length; i++) {
		const token = expression[i]
		if (/^\d+$/.test(token)) {
			outputQueue.push(parseInt(token))
		} else if ('*/+-'.indexOf(token) !== -1) {
			const o1 = token
			const o2 = operatorStack[operatorStack.length - 1]
			while ('*/+-'.indexOf(o2) !== -1 && ((operators[o1].associativity === 'Left' && operators[o1].precedence <= operators[o2].precedence) || (operators[o1].associativity === 'Right' && operators[o1].precedence < operators[o2].precedence))) {
				outputQueue.push(operatorStack.pop())
			}
			operatorStack.push(o1)
		} else if (token === '(') {
			operatorStack.push(token)
		} else if (token === ')') {
			while (operatorStack[operatorStack.length - 1] !== '(') {
				outputQueue.push(operatorStack.pop())
			}
			operatorStack.pop()
		} else {
			// variable name? treat like integer literal in this step
			outputQueue.push(token)
		}
	}
	while (operatorStack.length > 0) {
		outputQueue.push(operatorStack.pop())
	}
	return outputQueue
}

let keyFrames = []
async function parseKeyFrameFile(framerate, originalWidth, originalHeight) {
	const content = (await fs.promises.readFile(keyFrameFile)).toString()
	// CRLF is annoying.
	const lines = content.split('\n').filter((s) => s !== '')
	let data = lines.map((l) => l.replace(/\s/g, '').split(','))
	data = data.map((line) => {
		let time = line[0].split(/[:.-]/)
		// if there's only 1 "section" to the time, treat it as seconds. if there are 2, treat it as seconds:frames
		let parsedTime = Math.floor(parseInt(time[0]) * framerate) + (time.length === 1 ? 0 : parseInt(time[1]))

		const width = infixToPostfix(line[1])
		const height = infixToPostfix(line[2])

		let interpolation = line[3]

		return { time: parsedTime, width, height, interpolation }
	})
	data = data.sort((a, b) => a.time - b.time)
	if (data[0].time !== 0) {
		data = [{ time: 0, width: [originalWidth], height: [originalHeight], interpolation: 'linear' }, ...data]
	}

	// evaluate expressions for width/height
	// can't use map here, since we access previous elements from within the later ones.
	for (let dataIndex = 0; dataIndex < data.length; dataIndex++) {
		// if false is passed as evaluatingHeight, we are evaluating a width.
		const evaluatePostfix = (postfix, evaluatingHeight) => {
			const queue = []
			for (let i = 0; i < postfix.length; i++) {
				if (/^\d+$/.test(postfix[i])) queue.push(postfix[i])
				else if (postfix[i] === '+') queue.push(queue.pop() + queue.pop())
				else if (postfix[i] === '-')
					// slightly awkward way of subtracting, since we want to subtract the 2nd element from the first, not the other way.
					queue.push(-queue.pop() + queue.pop())
				else if (postfix[i] === '*') queue.push(queue.pop() * queue.pop())
				else if (postfix[i] === '/') {
					const b = queue.pop()
					queue.push(queue.pop() / b)
				} else if (postfix[i].toLowerCase() === 'lastWidth') queue.push(data[dataIndex - 1].width)
				else if (postfix[i].toLowerCase() === 'lastHeight') queue.push(data[dataIndex - 1].height)
				else if (postfix[i].toLowerCase() === 'last') queue.push(data[dataIndex - 1][evaluatingHeight ? 'height' : 'width'])
				else if (postfix[i].toLowerCase() === 'original') queue.push(evaluatingHeight ? originalHeight : originalWidth)
			}

			return Math.floor(queue[0])
		}

		data[dataIndex].width = evaluatePostfix(data[dataIndex].width, false)
		data[dataIndex].height = evaluatePostfix(data[dataIndex].height, true)
	}

	keyFrames = data
}
// various kinds of interpolation go here.
function lerp(a, b, t) {
	// convert the inputs to floats for accuracy, then convert the result back to an integer at the end
	a = a + 0.0
	b = b + 0.0
	return Math.floor(a + t * (b - a))
}

// Obtains a map of the audio levels in decibels from the input file.
async function getAudioLevelMap() {
	// The method requires escaping the file path.
	// Modify this regular expression if more are necessary.
	const escapePathRegex = /([\\/:])/g
	const { frames: rawAudioData } = JSON.parse((await execSync(`ffprobe -f lavfi -i "amovie='${videoPath.replace(escapePathRegex, '\\$1')}',astats=metadata=1:reset=1" -show_entries "frame=pkt_pts_time:frame_tags=lavfi.astats.Overall.RMS_level" -of json`, { maxBuffer: 1024 * 1000 * 8 /* 8mb */ })).stdout)
	// Remap to simplify the format.
	const intermediateMap = rawAudioData.map(({ tags: { 'lavfi.astats.Overall.RMS_level': dBs } }, i) => ({ frame: Number(i + 1), dBs: resolveNumber(dBs) }))
	// Obtain the highest audio level from the file.
	const highest = intermediateMap.reduce((previous, current) => (previous.dBs > current.dBs ? previous : current))
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
=======
function ffmpegErrorHandler(e) {
	console.error(e.message.split('\n').filter(m => !m.startsWith('  configuration:')).join('\n'))
>>>>>>> eff9f0ad9e54212769f89d1403d4012683fffafe
}

async function main() {
	// Verify the given path is accessible.
	if (!videoPath || !fs.existsSync(videoPath)) {
		if (videoPath)
			console.error(`Video file not found. "${videoPath}"`)
		else
			console.error(`Video file not given.`)
		return displayUsage()
	}

	// Only build the path if temporary location index if the code can move forward. Less to do.
	buildLocations()

	// Use one call to ffprobe to obtain framerate, width, and height, returned as JSON.
	console.log(`\
Input file: ${videoPath}.
Using minimum w/h ${ourUtil.delta}px.
Extracting necessary input file info...`
	)
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
Framerate is ${framerate} (${decimalFramerate}).`
	)

	// Print config
	console.log(`============Config============`)
	const modeName = type.w[0].toUpperCase() + type.w.slice(1)
	console.log(`Mode: ${modeName}`)
	if (type.w.includes('bounce') || type.w.includes('shutter'))
		console.log(`Bounce speed: ${tempo} times per second`)
	else if (type.w.includes('rotate'))
		console.log(`Rotating speed: ${angle} deg per second`)
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
	type.w = type.w.toLowerCase()
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
		frameCount,
		frameRate: decimalFramerate,
	}

	// Setup modes
	for (const modeToSetUp of type.w)
		if (modes[modeToSetUp].setup.constructor.name === 'AsyncFunction') await modes[modeToSetUp].setup(setupInfo)
		else modes[modeToSetUp].setup(setupInfo)

	process.stdout.write(`Converting frames to webm (File ${frame}/${frameCount})...`)

	const subProcess = []
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
		for (const mode of type.w) {
			const current = modes[mode].getFrameBounds(infoObject)
			if (current.width !== undefined) frameBounds.width = current.width
			if (current.height !== undefined) frameBounds.height = current.height
			if (current.command !== undefined) frameBounds.command = current.command
		}

		if (frameBounds.width === undefined) frameBounds.width = maxWidth
		if (frameBounds.height === undefined) frameBounds.height = maxHeight

		// Creates the respective resized frame based on the above.
<<<<<<< HEAD
		await execSync(`ffmpeg -y -i "${path.join(workLocations.tempFrames, file)}" -c:v vp8 -b:v ${bitrate} -crf 10 -vf scale=${width}x${height} -aspect ${width}:${height} -r ${framerate} -f webm "${path.join(workLocations.tempResizedFrames, file + '.webm')}"`, { maxBuffer: 1024 * 1000 * 8 /* 8mb */ })
		// Tracks the new file for concatenation later.
		lines.push(`file '${path.join(workLocations.tempResizedFrames, file + '.webm')}'`)
		process.stdout.clearLine()
		process.stdout.cursorTo(0)
		process.stdout.write(`Converting frames to webm (File ${++index}/${length})...`)
=======

		try {
			// The part of command can be change
			const command = frameBounds.command
				? frameBounds.command
				: `-vf scale=${frameBounds.width}x${frameBounds.height} -aspect ${frameBounds.width}:${frameBounds.height}`
			const outputFileName = path.join(workLocations.tempResizedFrames, file + '.webm')

			// Wait if subProcess is full
			if (subProcess.length >= maxThread)
				await subProcess.shift()
			// Add to subProcess
			subProcess.push(execSync(`ffmpeg -y -i "${path.join(workLocations.tempFrames, file)}" -c:v vp8 -b:v ${bitrate} -crf 10 ${command} -r ${framerate} -threads 1 -f webm "${outputFileName}"`,
				{ maxBuffer: 1024 * 1000 * 8 /* 8mb */ }))

			// Tracks the new file for concatenation later.
			tempFiles.push(`file '${path.join(workLocations.tempResizedFrames, file + '.webm')}'`)
			frame++
			process.stdout.clearLine()
			process.stdout.cursorTo(0)
			if (frame === frameCount) {
				for (const process of subProcess)
					await process
				// Clean up
				subProcess.length = 0
				process.stdout.write(`Converting frames to webm (done)...`)
				break
			}
			process.stdout.write(`Converting frames to webm (File ${frame}/${frameCount})...`)
		} catch (e) {
			ffmpegErrorHandler(e)
			return
		}
>>>>>>> eff9f0ad9e54212769f89d1403d4012683fffafe
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
		await execSync(`ffmpeg -y -f concat -safe 0 -i "${workLocations.tempConcatList}"${audioFlag ? ` -i "${workLocations.tempAudio}" ` : ' '}-c copy "${workLocations.outputFile}"`, { maxBuffer: 1024 * 1000 * 8 /* 8mb */ })
	} catch (e) {
		ffmpegErrorHandler(e)
	}

	// Recursive removal of temporary files via the main temporary folder.
	console.log('Done!\nRemoving temporary files...')
	await fs.promises.rm(workLocations.tempFolder, { recursive: true })
}

if (parseCommandArguments() !== true) return
void main()
