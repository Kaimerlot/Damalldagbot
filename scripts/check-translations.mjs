import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

const root = new URL('../src/locales/', import.meta.url)
const languages = ['sv', 'en']
const files = await Promise.all(languages.map(async (language) => [language, await readdir(new URL(`${language}/`, root))]))
const names = new Set(files.flatMap(([, paths]) => paths))
let failed = false

function flatten(value, prefix = '') {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return child && typeof child === 'object' && !Array.isArray(child) ? flatten(child, path) : [path]
  }).sort()
}

for (const name of names) {
  const contents = await Promise.all(languages.map(async (language) => JSON.parse(await readFile(join(new URL(`${language}/`, root).pathname, name), 'utf8'))))
  const svKeys = flatten(contents[0])
  const enKeys = flatten(contents[1])
  if (JSON.stringify(svKeys) !== JSON.stringify(enKeys)) {
    failed = true
    console.error(`Translation keys differ in ${name}`)
    console.error(`Missing in en: ${svKeys.filter((key) => !enKeys.includes(key)).join(', ') || 'none'}`)
    console.error(`Missing in sv: ${enKeys.filter((key) => !svKeys.includes(key)).join(', ') || 'none'}`)
  }
}

if (failed) process.exit(1)
console.log(`Translation key parity checked for ${names.size} namespaces.`)