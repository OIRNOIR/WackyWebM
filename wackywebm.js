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
const getFileName = p => path.basename(p, path.extname(p))

if (process.argv.length < 3 || process.argv.length > 4) return displayUsage()

// Process input arguments. Assume first argument is the desired output type, and if
// it matches none, assume part of the rawVideoPath and unshift it back before joining.
const [inputType, ...rawVideoPath] = process.argv.slice(2),
	type = { n: 0, w: 'Bounce' }
switch (inputType.toLowerCase()) {
	case 'bounce':
		type.n = 0
		type.w = 'Bounce'
		break
	case 'shutter':
		type.n = 1
		type.w = 'Shutter'
		break
	case 'sporadic':
		type.n = 2
		type.w = 'Sporadic'
		break
	case 'bounce+shutter':
		type.n = 3
		type.w = 'Bounce_Shutter'
		break
	case 'shrink':
		type.n = 4
		type.w = 'Shrink'
		break
	default:
		rawVideoPath.unshift(inputType)
}
const videoPath = rawVideoPath.join(' ').trim()
const fileName = getFileName(videoPath),
	filePath = path.dirname(videoPath)

// These could be arguments, as well. They could also be taken via user input with readline.
const delta = 2,
	bouncesPerSecond = 1.9

// Build an index of temporary locations so they do not need to be repeatedly rebuilt.
// All temporary files are within one parent folder for cleanliness and ease of removal.
const workLocations = {}
function buildLocations() {
	workLocations.tempFolder = path.join(__dirname, 'tempFiles')
	workLocations.tempAudio = path.join(workLocations.tempFolder, 'tempAudio.webm')
	//workLocations.tempVideo = path.join(workLocations.tempFolder, 'tempVideo.webm')
	workLocations.tempConcatList = path.join(workLocations.tempFolder, 'tempConcatList.txt')
	workLocations.tempFrames = path.join(workLocations.tempFolder, 'tempFrames')
	workLocations.tempFrameFiles = path.join(workLocations.tempFrames, '%d.png')
	workLocations.tempResizedFrames = path.join(workLocations.tempFolder, 'tempResizedFrames')
	workLocations.outputFile = path.join(filePath, `${fileName}_${type.w}.webm`)
}

function displayUsage() {
	console.log('WackyWebM by OIRNOIR#0032\nUsage: node wackywebm [optional_type: bounce, shutter, bounce+shutter, sporadic, shrink] <input_file>')
}

async function main() {
	// Verify the given path is accessible.
	if (!videoPath || !fs.existsSync(videoPath)) return displayUsage()

	// Only build the path if temporary location index if the code can move forward. Less to do.
	buildLocations()

	// Use one call to ffprobe to obtain framerate, width, and height, returned as JSON.
	console.log(`Input file: ${videoPath}\nUsing minimum w/h ${delta}px${type.w.includes('Bounce') ? ` and bounce speed of ${bouncesPerSecond} per second.` : ''}.\nExtracting necessary input file info...`)
	const videoInfo = await execSync(`ffprobe -v error -select_streams v -of json -show_entries stream=r_frame_rate,width,height "${videoPath}"`)
	// Deconstructor extracts these values and renames them.
	let { streams: [{ width: maxWidth, height: maxHeight, r_frame_rate: framerate }] } = JSON.parse(videoInfo.stdout.trim())
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
		await execSync(`ffmpeg -y -i "${videoPath}" -vn -c:a libvorbis "${workLocations.tempAudio}"`)
	}
	catch {
		console.log('No audio detected.')
		audioFlag = false
	}

	// Extracts the frames to be modified for the wackiness.
	console.log('Splitting file into frames...')
	await execSync(`ffmpeg -y -i "${videoPath}" "${workLocations.tempFrameFiles}"`)

	// Sorts with a map so extraction of information only happens once per entry.
	const tempFramesFiles = fs.readdirSync(workLocations.tempFrames)
	const tempFramesFrames = tempFramesFiles.filter(f => f.endsWith('png')).map(f => ({ file: f, n: Number(getFileName(f)) })).sort((a, b) => a.n - b.n)
	// Index tracked from outside. Width and/or height initialize as the maximum and are not modified if unchanged.
	let index = 0,
		lines = [],
		width = maxWidth,
		height = maxHeight
	process.stdout.write(`Converting frames to webm (File ${index}/${tempFramesFrames.length})...`)
	
	for (const { file } of tempFramesFrames) {
		// Makes the height/width changes based on the selected type.
		switch (type.n) {
			case 0:
				height = index === 0 ? maxHeight : (Math.floor(Math.abs(Math.cos(index / (decimalFramerate / bouncesPerSecond) * Math.PI) * (maxHeight - delta))) + delta)
				break
			case 1:
				width = index === 0 ? maxWidth : (Math.floor(Math.abs(Math.cos(index / (decimalFramerate / bouncesPerSecond) * Math.PI) * (maxWidth - delta))) + delta)
				break
			case 2:
				width = index === 0 ? maxWidth : (Math.floor(Math.random() * (maxWidth - delta)) + delta)
				height = index === 0 ? maxHeight : (Math.floor(Math.random() * (maxHeight - delta)) + delta)
				break
			case 3:
				height = index === 0 ? maxHeight : (Math.floor(Math.abs(Math.cos(index / (decimalFramerate / bouncesPerSecond) * Math.PI) * (maxHeight - delta))) + delta)
				width = index === 0 ? maxWidth : (Math.floor(Math.abs(Math.sin(index / (decimalFramerate / bouncesPerSecond) * Math.PI) * (maxWidth - delta))) + delta)
				break
			case 4:
				height = Math.max(1, Math.floor(maxHeight - ((index / tempFramesFrames.length) * maxHeight)));
				break
		}
		// Creates the respective resized frame based on the above.
		await execSync(`ffmpeg -y -i "${path.join(workLocations.tempFrames, file)}" -c:v vp8 -b:v 1M -crf 10 -vf scale=${width}x${height} -aspect ${width}:${height} -r ${framerate} -f webm "${path.join(workLocations.tempResizedFrames, file + '.webm')}"`)
		// Tracks the new file for concatenation later.
		lines.push(`file '${path.join(workLocations.tempResizedFrames, file + '.webm')}'`)
		index++
		process.stdout.clearLine()
		process.stdout.cursorTo(0)
		process.stdout.write(`Converting frames to webm (File ${index}/${tempFramesFrames.length})...`)
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
	//await execSync(`ffmpeg -y -i "${workLocations.tempVideo}" -i "${workLocations.tempAudio}" -c copy "${path.join(filePath, `${fileName}_${type.w}.webm`)}"`)

	// Congatenates segments and applies te original audio to the new file.
	console.log(`Concatenating segments${audioFlag ? ' and applying audio ' : ' '}for final webm file...`)
	//if(audioFlag) await execSync(`ffmpeg -y -f concat -safe 0 -i "${workLocations.tempConcatList}" -i "${workLocations.tempAudio}" -c copy "${workLocations.outputFile}"`)
	//else await execSync(`ffmpeg -y -f concat -safe 0 -i "${workLocations.tempConcatList}" -c copy "${workLocations.outputFile}"`)
	await execSync(`ffmpeg -y -f concat -safe 0 -i "${workLocations.tempConcatList}"${audioFlag ? ` -i "${workLocations.tempAudio}" ` : ' '}-c copy "${workLocations.outputFile}"`)

	// Recursive removal of temporary files via the main temporary folder.
	console.log('Done!\nRemoving temporary files...')
	await fs.promises.rm(workLocations.tempFolder, { recursive: true })

}

void main()
