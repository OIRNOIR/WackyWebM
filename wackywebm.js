'use strict'

/*
Make WebM files with changing aspect ratios
By OIRNOIR#0032
*/

const path = require('path')
const fs = require('fs')
// Synchronous execution via promisify.
const util = require('util')
const execSync = util.promisify(require('child_process').exec)
const getFileName = (p) => path.basename(p, path.extname(p))
// In case audio level readouts throw an "-inf"
// this will make it Javascript's negative infinity.
const resolveNumber = (n) => (isNaN(Number(n)) ? Number.NEGATIVE_INFINITY : Number(n))

const modes = ['Bounce', 'Shutter', 'Sporadic', 'Bounce+Shutter', 'Shrink', 'Audio-Bounce', 'Audio-Shutter', 'Audio-Both', 'Keyframes', 'Jumpscare']
module.exports = { modes }

const type = { w: undefined }
let videoPath = '',
	outputPath = undefined,
	keyFrameFile = undefined,
	bitrate = undefined

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

	// positional arguments
	//
	// basically, first positional argument is inputType, second one
	// (and every one after that) is video path, except when the first one doesn't
	// match any of the input types, in which case its also part of the path.
	if (type.w === undefined && modes.map((m) => m.toLowerCase()).includes(arg.toLowerCase())) {
		type.w = modes.find((m) => m.toLowerCase() === arg.toLowerCase()).replace(/\+/g, '_')
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
if (bitrate == undefined) bitrate = '1M'

const fileName = getFileName(videoPath),
	filePath = path.dirname(videoPath)

// no "-o" argument, use default path in the format "chungus_Bounce.webm"
if (outputPath === undefined) outputPath = path.join(filePath, `${fileName}_${type.w}.webm`)

// These could be arguments, as well. They could also be taken via user input with readline.
const delta = 2,
	bouncesPerSecond = 1.9

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
		'\t-k,--keyframes: only required with the type set to "Keyframes", sets the path to the keyframe file\n\n' +
		'\t-b,--bitrate: change the bitrate used to encode the file (Default is 1 MB/s)' +
		'Recognized Modes:\n' +
		modes
			.map((m) => `\t${m}`)
			.join('\n')
			.toLowerCase() +
		'\nIf no mode is specified, "Bounce" is used.'
	console.log(Usage)
}

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
	//return intermediateMap.map(v => ({ percentMax: 1 - (highest.dBs / v.dBs), ...v })) // Shrink when louder.
	// Amend percentages of the audio per frame vs. the highest in the file.
	return intermediateMap.map((v) => ({ percentMax: highest.dBs / v.dBs, ...v }))
}

async function main() {
	// Verify the given path is accessible.
	if (!videoPath || !fs.existsSync(videoPath)) return displayUsage()

	// Only build the path if temporary location index if the code can move forward. Less to do.
	buildLocations()

	// Use one call to ffprobe to obtain framerate, width, and height, returned as JSON.
	console.log(`Input file: ${videoPath}\nUsing minimum w/h ${delta}px${type.w.includes('Bounce') || type.w.includes('Shutter') ? ` and bounce speed of ${bouncesPerSecond} per second.` : ''}.\nExtracting necessary input file info...`)
	const videoInfo = await execSync(`ffprobe -v error -select_streams v -of json -show_entries stream=r_frame_rate,width,height "${videoPath}"`, { maxBuffer: 1024 * 1000 * 8 /* 8mb */ })
	// Deconstructor extracts these values and renames them.
	let {
		streams: [{ width: maxWidth, height: maxHeight, r_frame_rate: framerate }],
	} = JSON.parse(videoInfo.stdout.trim())
	maxWidth = Number(maxWidth)
	maxHeight = Number(maxHeight)
	const decimalFramerate = framerate.includes('/') ? Number(framerate.split('/')[0]) / Number(framerate.split('/')[1]) : Number(framerate)

	if (type.w === 'Keyframes') {
		console.log(`Parsing Keyframe File ${keyFrameFile}`)
		await parseKeyFrameFile(decimalFramerate, maxWidth, maxHeight)
	}

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
		width = maxWidth,
		height = maxHeight,
		length = tempFramesFrames.length,
		lastKf = 0
	if (type.w.includes('Audio')) {
		type.audioMap = await getAudioLevelMap()
		type.audioMapL = type.audioMap.length - 1
	}
	process.stdout.write(`Converting frames to webm (File ${index}/${tempFramesFrames.length})...`)

	for (const { file } of tempFramesFrames) {
		// Makes the height/width changes based on the selected type.
		switch (type.w) {
			case 'Bounce':
				height = Math.floor(Math.abs(Math.cos((index / (decimalFramerate / bouncesPerSecond)) * Math.PI) * (maxHeight - delta))) + delta
				break
			case 'Shutter':
				width = Math.floor(Math.abs(Math.cos((index / (decimalFramerate / bouncesPerSecond)) * Math.PI) * (maxWidth - delta))) + delta
				break
			case 'Sporadic':
				width = Math.floor(Math.random() * (maxWidth - delta)) + delta
				height = Math.floor(Math.random() * (maxHeight - delta)) + delta
				break
			case 'Bounce+Shutter':
				height = Math.floor(Math.abs(Math.cos((index / (decimalFramerate / bouncesPerSecond)) * Math.PI) * (maxHeight - delta))) + delta
				width = Math.floor(Math.abs(Math.sin((index / (decimalFramerate / bouncesPerSecond)) * Math.PI) * (maxWidth - delta))) + delta
				break
			case 'Shrink':
				height = Math.max(1, Math.floor(maxHeight - (index / tempFramesFrames.length) * maxHeight))
				break
			case 'Audio-Bounce':
				// I put these lines in brackets so my IDE wouldn't complain that the percentMax constant was being declared twice, even though that would never happen in the code.
				{
					// Since audio frames don't match video frames, this calculates the percentage
					// through the file a video frame is and grabs the closest audio frame's decibels.
					const { percentMax } = type.audioMap[Math.max(Math.min(Math.floor((index / (length - 1)) * type.audioMapL), type.audioMapL), 0)]
					height = Math.max(Math.floor(Math.abs(maxHeight * percentMax)), delta)
					//width = Math.max(Math.floor(Math.abs(maxWidth * percentMax)), delta)
				}
				break

				case 'Jumpscare':
				{
					height = Math.max(1, Math.floor(maxHeight - (index / (decimalFramerate / 10)) * Math.PI))
					width = Math.max(1, Math.floor(maxWidth - (index / (decimalFramerate / 10)) * Math.PI))
					if (index > 466)
		{
			height = maxHeight;
			width = maxWidth;
		}	
					
				}
				break	
			case 'Audio-Shutter':
				{
					const { percentMax } = type.audioMap[Math.max(Math.min(Math.floor((index / (length - 1)) * type.audioMapL), type.audioMapL), 0)]
					width = Math.max(Math.floor(Math.abs(maxWidth * percentMax)), delta)
				}
				break
			case 'Audio-Both':
				{
					const { percentMax } = type.audioMap[Math.max(Math.min(Math.floor((index / (length - 1)) * type.audioMapL), type.audioMapL), 0)]
					height = Math.max(Math.floor(Math.abs(maxHeight * percentMax)), delta)
					width = Math.max(Math.floor(Math.abs(maxWidth * percentMax)), delta)
				}
				break
			case 'Keyframes':
				if (lastKf !== keyFrames.length - 1 && index >= keyFrames[lastKf + 1].time) {
					lastKf++
				}
				if (lastKf === keyFrames.length - 1) {
					// no more keyframes after this; keep current size.
					width = keyFrames[lastKf].width
					height = keyFrames[lastKf].height
					break
				}
				
		
		

				// eslint-disable-next-line no-case-declarations
				const t = (index - keyFrames[lastKf].time) / (keyFrames[lastKf + 1].time - keyFrames[lastKf].time)
				// who doesnt love more switches :)
				switch (keyFrames[lastKf].interpolation.toLowerCase()) {
					case 'linear':
						width = lerp(keyFrames[lastKf].width, keyFrames[lastKf + 1].width, t)
						height = lerp(keyFrames[lastKf].height, keyFrames[lastKf + 1].height, t)
						break
				}

				
				
		}
		// If it's the first frame, make it the same size as the original, except for Keyframes mode, where the user has control.
		if (index === 0 && type.w != 'Keyframes') {
			width = maxWidth
			height = maxHeight
		}

		// Creates the respective resized frame based on the above.
		await execSync(`ffmpeg -y -i "${path.join(workLocations.tempFrames, file)}" -c:v vp8 -b:v ${bitrate} -crf 10 -vf scale=${width}x${height} -aspect ${width}:${height} -r ${framerate} -f webm "${path.join(workLocations.tempResizedFrames, file + '.webm')}"`, { maxBuffer: 1024 * 1000 * 8 /* 8mb */ })
		// Tracks the new file for concatenation later.
		lines.push(`file '${path.join(workLocations.tempResizedFrames, file + '.webm')}'`)
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
