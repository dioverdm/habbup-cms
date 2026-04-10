import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname  = path.dirname(fileURLToPath(import.meta.url))
const SOURCE     = path.join(__dirname, '..', 'data', 'changelog.json')

// On Vercel the project root is read-only → write to /tmp
// In local dev we write directly to data/changelog.json
const IS_VERCEL  = !!process.env.VERCEL
const TMP_FILE   = '/tmp/habbup_changelog.json'

function resolveFile() {
  if (!IS_VERCEL) return SOURCE
  // Lazily copy source → /tmp on first write
  if (!fs.existsSync(TMP_FILE)) {
    const initial = fs.existsSync(SOURCE) ? fs.readFileSync(SOURCE) : '[]'
    fs.writeFileSync(TMP_FILE, initial)
  }
  return TMP_FILE
}

export function readChangelog() {
  const file = IS_VERCEL ? (fs.existsSync(TMP_FILE) ? TMP_FILE : SOURCE) : SOURCE
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')) }
  catch { return [] }
}

export function writeChangelog(data) {
  fs.writeFileSync(resolveFile(), JSON.stringify(data, null, 2), 'utf-8')
}

