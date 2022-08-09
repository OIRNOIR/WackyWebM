'use strict'

// do this before importing wackywebm or util, so that they use our modified locale
const { setLocale, localiseString } = require('./localisation.js')

if (process.argv.length > 2)
	setLocale(process.argv[2])

// spaghetti ahead; beware.
// i strongly advise no one to ever touch this again unless you're being paid a lot for it.

const { terminal: term } = require('terminal-kit')
const path = require('path')
const { modes, args, main } = require('./wackywebm.js')
const { getFileName } = require('./util')
const fs = require('fs')

// 0: select locale
// 1: select mode to use
// 2: optional and required flags
// 3: file selection
// 4: confirm
// 5: progress bar
let stage = 1

term.grabInput()

const modeList = Object.keys(modes)
let selectedMode = modeList.indexOf('bounce')
const redrawStage1 = () => {
	term.clear()
	term.bold.underline(`${localiseString('select_mode_arrows')}\n\n`)
	for (let modeIx in modeList) {
		// i dont know why js decided that iterating over an array's indices should give you strings...
		modeIx = parseInt(modeIx)
		if (modeIx === selectedMode)
			term.italic.underline(modeList[modeIx])
		else
			term(modeList[modeIx])
		term('   ')
	}
}

const flags = {}
let editingText = false
let currentEdit = undefined
let currentText = ''

// very jank - half of this stage 2 code only works if all the arguments start in "--"
const keysToFlags = {
	'b': '--bitrate',
	't': '--thread',
	'o': '--output',
	'c': '--compression'
}

const redrawStage2 = () => {
	term.clear()
	if (currentEdit === undefined) {
		term.bold.underline(`${modeList[selectedMode] === 'keyframes' ? localiseString('change_options_k') : localiseString('change_options')}\n\n`)
		// the process of figuring out which options to display here could possibly be automated, but it seems too much
		// trouble for the marginal benefit, considering how rarely new ones get added.
		for (const key of Object.keys(keysToFlags)) {
			term.italic(key)
			term(`: ${args.filter(a => a.keys.includes(keysToFlags[key]))[0].description}\n`)
		}

		term.bold.underline(`\n${localiseString('current_arg_values')}\n`)
		for (const flag of Object.keys(flags))
			term(`${flag} = "${flags[flag]}"\n`)
	} else {
		term.bold.underline(`${localiseString('enter_arg_value', { arg: currentEdit })}\n`)
		term.italic(currentText)
	}

}

let filename = ''
const redrawStage3 = () => {
	term.clear()
	term.bold.underline(`${localiseString('enter_file_path')}\n\n`)
	editingText = true
	term(filename)
}

const redrawStage4 = () => {
	term.clear()
	term.bold.underline(`${localiseString('review_settings')}\n\n`)
	term.underline(localiseString('r_s_mode'))
	term(` ${modeList[selectedMode]}\n`)
	term.underline(localiseString('r_s_args'))
	term('\n')
	for (let argName of Object.keys(flags)) {
		term.italic(`\t${argName}: `)
		term(flags[argName] + '\n')
	}
	term.underline(localiseString('r_s_file'))
	term(` ${filename}\n`)
}

let mainTask
let mainTaskDone = false
const redrawStage5 = async () => {
	if (!mainTaskDone) {
		term.clear()
		await mainTask
		mainTaskDone = true
		term('\n\n\n')
		term.bold.underline(localiseString('tui_done'))
	}
}

term.on('key', (name) => {
	// console.log('key event: ', name)
	if ((['Q', 'q'].includes(name) && !editingText) || name === 'CTRL_C')
		process.exit(0)

	// DO NOT EVER TOUCH STAGES 1 AND 2
	// i have written them and lost track of how anything works about 5 minutes later. good luck to anyone else trying
	// to find out.
	// 3-5 are a little easier to understand, but still not particularly clean code, so be careful and dont break anything
	if (stage === 1) {
		if (name === 'LEFT')
			selectedMode = Math.max(0, selectedMode - 1)
		if (name === 'RIGHT')
			selectedMode = Math.min(modeList.length - 1, selectedMode + 1)
		if (name === 'ENTER') {
			stage = 2
			if (modeList[selectedMode] === 'keyframes')
				keysToFlags['x'] = '--keyframes'
			else if (modeList[selectedMode] === 'bounce' || modeList[selectedMode] === 'shutter')
				keysToFlags['x'] = '--tempo'
			else if (modeList[selectedMode] === 'angle')
				keysToFlags['x'] = '--angle'
		}
	} else if (stage === 2) {
		if (editingText && name !== 'ENTER') {
			if (name === 'BACKSPACE')
				currentText = currentText.substring(0, currentText.length - 1)
			else if (name === 'ESCAPE' || name === 'SHIFT_ESCAPE' || name === 'CTRL_ESCAPE') {
				currentText = ""
				editingText = false
				currentEdit = undefined
			}
			// this catches SOME control characters, like F2, but also definitely *does not* catch some "normal" UTF-8 chars, as intended.
			else if (name.length > 2) {
				/* ignore inputs like LEFT, TAB, etc */
			}
			else
				currentText += name
		} else if (editingText && name === 'ENTER') {
			if (currentText === "")
			{
				currentText = ""
				editingText = false
				currentEdit = undefined
			} else {
				editingText = false
				flags[currentEdit] = currentText
				currentEdit = undefined
				currentText = ''
			}
		} else if (keysToFlags[name] !== undefined) {
			editingText = true
			currentEdit = keysToFlags[name]
			currentText = flags[keysToFlags[name]] ?? ''
		} else if (name === 'ENTER') {
			if (modeList[selectedMode] === 'keyframes' && flags['--keyframes'] === undefined)
				return redrawStage2() || term(`\n\n${localiseString('keyframes_file_needed')}`)
			stage = 3
		}
	} else if (stage === 3) {
		if (name === 'ENTER') {
			if (!fs.existsSync(filename))
				return redrawStage3() || term(`\n\n${localiseString('file_not_found')}`)
			stage = 4
			editingText = false

		}
		else {
			if (name === 'BACKSPACE')
				filename = filename.substring(0, filename.length - 1)
			else if (name.length > 2) {
				/* ignore inputs like LEFT, TAB, etc */
			}
			else
				filename += name
		}
	} else if (stage === 4) {
		if (name === 'ENTER') {
			stage = 5

			if (!flags['--bitrate'])
				flags['--bitrate'] = '1M'
			if (!flags['--thread'])
				flags['--thread'] = 2
			if (!flags['--tempo'])
				flags['--tempo'] = 2
			if (!flags['--angle'])
				flags['--angle'] = 360
			if (!flags['--compression'])
				flags['--compression'] = 0
			if (!flags['--output'])
				// not perfect, but works well enough
				flags['--output'] = `${path.join(path.dirname(filename), getFileName(filename))}_${modeList[selectedMode]}.webm`

			mainTask = main([modeList[selectedMode]], filename, flags['--keyframes'], flags['--bitrate'], flags['--thread'], flags['--tempo'], flags['--angle'], flags['--compression'], flags['--output'])
		}
	} else if (stage === 5) {
		if (mainTaskDone)
			process.exit(0)
	}

	if (stage === 1)
		redrawStage1()
	if (stage === 2)
		redrawStage2()
	if (stage === 3)
		redrawStage3()
	if (stage === 4)
		redrawStage4()
	if (stage === 5)
		redrawStage5()

})

redrawStage1()