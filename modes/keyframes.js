const fs = require('fs')

let lastKf = 0

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
async function parseKeyFrameFile(keyFrameFile, framerate, originalWidth, originalHeight) {
	const content = (await fs.promises.readFile(keyFrameFile)).toString()
	// currently, whitespace except newlines *never* serves a syntactic function, so we can just remove it at the start.
	const lines = content
		.split('\n')
		.map((l) => l.replace(/\s/g, ''))
		.filter((s) => s !== '' && s[0] !== '#')
	let data = lines.map((l) => l.split(','))
	data = data.map((line) => {
		let time = line[0].split(/[:.-]/)
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
				} else if (postfix[i].toLowerCase() === 'lastwidth') queue.push(data[dataIndex - 1].width)
				else if (postfix[i].toLowerCase() === 'lastheight') queue.push(data[dataIndex - 1].height)
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

module.exports = {
	setup: async (info) => {
		console.log(`Parsing Keyframe File ${info.keyFrameFile}`)
		await parseKeyFrameFile(info.keyFrameFile, info.frameRate, info.maxWidth, info.maxHeight)
	},
	getFrameBounds: (info) => {
		if (lastKf !== keyFrames.length - 1 && info.frame >= keyFrames[lastKf + 1].time) {
			lastKf++
		}
		if (lastKf === keyFrames.length - 1)
			return {
				width: keyFrames[lastKf].width,
				height: keyFrames[lastKf].height,
			}

		const t = (info.frame - keyFrames[lastKf].time) / (keyFrames[lastKf + 1].time - keyFrames[lastKf].time)
		switch (keyFrames[lastKf].interpolation.toLowerCase()) {
			case 'linear':
				return {
					width: lerp(keyFrames[lastKf].width, keyFrames[lastKf + 1].width, t),
					height: lerp(keyFrames[lastKf].height, keyFrames[lastKf + 1].height, t),
				}
		}
	},
}
