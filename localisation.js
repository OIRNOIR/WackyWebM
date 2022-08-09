const path = require('path')
const fs = require('fs')

const translations = []
const localesDir = path.join(__dirname, 'localisations')
for (const locale of fs.readdirSync(localesDir).filter((file) => file.endsWith('.js'))) {
	try {
		translations.push(require(path.join(localesDir, locale)))
	} catch (e) {
		console.warn(`loading translation file ${locale} failed`)
	}
}

let fallBackLocale = translations.filter(x => x.aliases.some(alias => alias.constructor.name === 'RegExp' ? alias.test('en_us') : alias === 'en_us'))[0]

let currentLocale = fallBackLocale
function setLocale(l) {
	l = l.toString().toLowerCase()
	console.warn(`No Locale Matching "${l}" found, using "en-us"`)
	currentLocale = translations.filter(x => x.aliases.some(alias => alias.constructor.name === 'RegExp' ? alias.test(l) : alias === l))[0] ?? fallBackLocale
}

function localiseString(key, args = {}) {
	key = key.toString().toLowerCase().replace(/[- ]/g, '_')
	let rawTranslation = currentLocale[key] ?? fallBackLocale[key] ?? fallBackLocale['no_translation']
	for (const replaceKey of Object.keys(args))
		rawTranslation = rawTranslation.replaceAll(`{${replaceKey.toLowerCase()}}`, args[replaceKey])

	return rawTranslation
}

module.exports = { setLocale, localiseString }