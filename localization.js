const path = require('path')
const fs = require('fs')

const aliases = {
	en_us: [/en([-_](au|bz|ca|cb|gb|in|ie|jm|nz|ph|za|tt|us))?/, /english/],
}

const translations = {}
const localesDir = path.join(__dirname, 'localizations')
for (const locale of fs.readdirSync(localesDir).filter((file) => file.endsWith('.json'))) {
	try {
		translations[locale.replace('.json', '')] = require(path.join(localesDir, locale))
	} catch (e) {
		console.warn(`loading translation file ${locale} failed`)
	}
}

function findLocale(l) {
	for (const locale in aliases) {
		for (const alias of aliases[locale]) {
			if (alias.test(l)) {
				return locale
			}
		}
	}
	return ''
}

let fallBackLocale = translations['en_us']
let currentLocale = fallBackLocale

function setLocale(l) {
	l = l.toString().toLowerCase()
	let localeName = findLocale(l)
	console.log(localeName)
	if (!localeName || !translations[localeName]) {
		console.warn(`No locale matching "${l}" found, using "en_us"`)
		currentLocale = fallBackLocale
	}
}

function localizeString(key, args = {}) {
	key = key.toString().toLowerCase().replace(/[- ]/g, '_')
	let rawTranslation = currentLocale[key] ?? fallBackLocale[key] ?? fallBackLocale['no_translation']
	for (const replaceKey of Object.keys(args)) rawTranslation = rawTranslation.replaceAll(`{${replaceKey.toLowerCase()}}`, args[replaceKey])

	return rawTranslation
}

module.exports = { setLocale, localizeString }
