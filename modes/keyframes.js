'use strict'

const fs = require('fs')
const { localizeString } = require('../localization')

let lastKf = 0
let keyFrames = []

function lerp(a, b, t) {
	// convert the inputs to floats for accuracy, then convert the result back to an integer at the end
	a = a + 0.0
	b = b + 0.0
	return Math.floor(a + t * (b - a))
}

// the argument has 5 fields: nextWidth, nextHeight, lastWidth, lastHeight (which are pretty self-explanatory),
// and "t", which ranges from 0 to 1 and is equal to the fraction of the current keyframe's duration that has already
// taken place
const interpolationModes = {
	"linear": (i) => {
		return {
			width: lerp(i.lastWidth, i.nextWidth, i.t),
			height: lerp(i.lastHeight, i.nextHeight, i.t),
		}
	},
	"instant": (i) => {
		return {
			width: i.lastWidth,
			height: i.lastHeight,
		}
	}
}

module.exports = {
	setup: async (info) => {
		console.log(`${localizeString('parsing_keyframes', { file: info.keyFrameFile })}`)
		await parseKeyFrameFile(info.keyFrameFile, info.frameRate, info.maxWidth, info.maxHeight)
	},
	getFrameBounds: (info) => {
		if (lastKf !== keyFrames.length - 1 && info.frame >= keyFrames[lastKf + 1].time) {
			lastKf++
		}

		// if there is still a keyframe to skip, there were multiple on one frame. consume those and warn the user.
		while (lastKf !== keyFrames.length - 1 && info.frame >= keyFrames[lastKf + 1].time) {
			lastKf++
			console.warn(localizeString('excess_keyframes', { time: keyFrames[lastKf].time }))
		}

		if (lastKf === keyFrames.length - 1)
			return {
				width: keyFrames[lastKf].width,
				height: keyFrames[lastKf].height,
			}

		const t = (info.frame - keyFrames[lastKf].time) / (keyFrames[lastKf + 1].time - keyFrames[lastKf].time)
		const [lastWidth, lastHeight] = [keyFrames[lastKf].width, keyFrames[lastKf].height]
		const [nextWidth, nextHeight] = lastKf === keyFrames.length - 1 ? [lastWidth, lastHeight] : [keyFrames[lastKf + 1].width, keyFrames[lastKf + 1].height]

		const interpolationArg = {t, lastWidth, lastHeight, nextWidth, nextHeight}

		const interpolationMode = keyFrames[lastKf].interpolation.toLowerCase()
		if (!interpolationModes[interpolationMode])
			throw new Error(localizeString("unrecognized_interpolation", { mode: interpolationMode }))

		return interpolationModes[interpolationMode](interpolationArg)
	},
}

async function parseKeyFrameFile(keyFrameFile, framerate, originalWidth, originalHeight) {
	const content = (await fs.promises.readFile(keyFrameFile)).toString()
	// currently, whitespace except newlines *never* serves a syntactic function, so we can just remove it at the start.
	const lines = content
		.split('\n')
		// keep track of the index of each line as well, so that we can later give more helpful error messages
		.map((l, i) => [l.replace(/\s/g, ''), i + 1])
		.filter((s) => s[0] !== '' && s[0][0] !== '#')
	let data = lines.map((l) => [l[0].split(','), l[1]])
	data = data.map((lineInfo) => {
		let line = lineInfo[0]
		let lineNumber = lineInfo[1]

		if (line.length < 3)
			throw new Error(localizeString('not_enough_fields', { line: lineNumber }))
		if (line.length > 4)
			throw new Error(localizeString('too_many_fields', { line: lineNumber }))

		let time = line[0].split(/[:.-]/)

		if (time.some(t => isNaN(parseInt(t))) || time.length >= 3)
			throw new Error(localizeString('invalid_time', { line: lineNumber, input: time }))

		if (time.length === 2 && parseInt(time[1]) >= framerate)
			console.warn(localizeString('large_frame_specifier', { line: lineNumber }))

		// if there's only 1 "section" to the time, treat it as seconds. if there are 2, treat it as seconds:frames
		let parsedTime = Math.floor(parseInt(time[0]) * framerate) + (time.length === 1 ? 0 : parseInt(time[1]))

		const width = infixToPostfix(line[1])
		const height = infixToPostfix(line[2])

		let interpolation = line[3] ?? 'linear'

		return { time: parsedTime, width, height, interpolation }
	})
	data = data.sort((a, b) => a.time - b.time)
	if (data[0].time !== 0) {
		data = [{ time: 0, width: [originalWidth], height: [originalHeight], interpolation: 'linear' }, ...data]
	}

	// evaluate expressions for width/height
	// can't use map here, since we access previous elements from within the later ones.
	for (let dataIndex = 0; dataIndex < data.length; dataIndex++) {
		data[dataIndex].width = evaluatePostfix(data[dataIndex].width, false, data, dataIndex, originalHeight, originalWidth)
		data[dataIndex].height = evaluatePostfix(data[dataIndex].height, true, data, dataIndex, originalHeight, originalWidth)
	}

	keyFrames = data
}

const evaluatePostfix = (postfix, evaluatingHeight, data, dataIndex, originalHeight, originalWidth) => {
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
		} else if (postfix[i].toLowerCase() === 'lastwidth') queue.push(data[dataIndex - 1].width)
		else if (postfix[i].toLowerCase() === 'lastheight') queue.push(data[dataIndex - 1].height)
		else if (postfix[i].toLowerCase() === 'last') queue.push(data[dataIndex - 1][evaluatingHeight ? 'height' : 'width'])
		else if (postfix[i].toLowerCase() === 'original') queue.push(evaluatingHeight ? originalHeight : originalWidth)
	}

	return Math.floor(queue[0])
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
			// parse the intermediate value as float here - we truncate later.
			outputQueue.push(parseFloat(token))
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
			outputQueue.push(token)
		}
	}
	while (operatorStack.length > 0) {
		outputQueue.push(operatorStack.pop())
	}
	return outputQueue
}