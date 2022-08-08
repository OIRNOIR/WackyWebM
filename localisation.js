const path = require('path')
const fs = require('fs')
// to modify console.warn & console.error
require('./util.js')

const translations = {}
const localesDir = path.join(__dirname, 'localisations')
for (const locale of fs.readdirSync(localesDir).filter((file) => file.endsWith('.js'))) {
	try {
		const localeObject = require(path.join(localesDir, locale))
		for (const a in localeObject.aliases)
			// this is not as terrible for memory usage as it looks at first glance; we are assigning the same reference
			// to all aliases, not a new copy each time.
			translations[a] = localeObject
	} catch (e) {
		console.warn(`loading translation file ${locale} failed`)
	}
}

let currentLocale = 'en_us'
function setLocale(l) {
	currentLocale = l
}

let fallBackLocale = translations[Object.keys(translations).filter(x => x.constructor.name === 'RegExp' ? x.test('en_us') : x === 'en_us')]

function localiseString(key) {
	key = key.toString()
	for (const locale of Object.keys(translations)) {
		if ((locale.constructor.name === 'RegExp' && locale.test(currentLocale)) || locale === currentLocale)
			return translations[locale][key] ?? translations[locale]["no_translation"]
	}
	// no locale matching currentLocale found
	console.warn(`No Locale Matching "${currentLocale}" found, using "en-us"`)
	return fallBackLocale[key]
}