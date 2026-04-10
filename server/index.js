import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001
const DATA_FILE = path.join(__dirname, 'data', 'changelog.json')
const DIST_DIR = path.join(__dirname, '..', 'dist')

// ─── Credentials ────────────────────────────────────────────────────────────
const ADMIN_USER = process.env.ADMIN_USER || 'Kryon'
const ADMIN_PASS = process.env.ADMIN_PASS || '33476373'
const SESSION_TOKEN = 'habbup_admin_token'
let activeTokens = new Set()

// ─── Helpers ─────────────────────────────────────────────────────────────────
const readChangelog = () => {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
  } catch {
    return []
  }
}

const writeChangelog = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

const authMiddleware = (req, res, next) => {
  const token = req.headers['x-admin-token']
  if (!token || !activeTokens.has(token)) {
    return res.status(401).json({ error: 'No autorizado' })
  }
  next()
}

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json())

// CORS in dev
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, x-admin-token')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

// ─── Auth ─────────────────────────────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = randomUUID()
    activeTokens.add(token)
    return res.json({ token })
  }
  res.status(401).json({ error: 'Credenciales incorrectas' })
})

app.post('/api/auth/logout', authMiddleware, (req, res) => {
  activeTokens.delete(req.headers['x-admin-token'])
  res.json({ ok: true })
})

app.get('/api/auth/verify', authMiddleware, (req, res) => {
  res.json({ ok: true })
})

// ─── Changelog (public) ───────────────────────────────────────────────────────
app.get('/api/changelog', (req, res) => {
  const data = readChangelog()
  res.json(data.sort((a, b) => new Date(b.date) - new Date(a.date)))
})

// ─── Changelog (admin) ───────────────────────────────────────────────────────
app.post('/api/changelog', authMiddleware, (req, res) => {
  const { version, date, type, title, description } = req.body
  if (!version || !date || !type || !title || !description) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' })
  }
  const data = readChangelog()
  const entry = { id: randomUUID(), version, date, type, title, description, author: ADMIN_USER }
  data.push(entry)
  writeChangelog(data)
  res.status(201).json(entry)
})

app.put('/api/changelog/:id', authMiddleware, (req, res) => {
  const data = readChangelog()
  const idx = data.findIndex(e => e.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'No encontrado' })
  data[idx] = { ...data[idx], ...req.body, id: data[idx].id, author: ADMIN_USER }
  writeChangelog(data)
  res.json(data[idx])
})

app.delete('/api/changelog/:id', authMiddleware, (req, res) => {
  const data = readChangelog()
  const idx = data.findIndex(e => e.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'No encontrado' })
  data.splice(idx, 1)
  writeChangelog(data)
  res.json({ ok: true })
})

// ─── Serve dist in production ─────────────────────────────────────────────────
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR))
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(DIST_DIR, 'index.html'))
    }
  })
}

app.listen(PORT, () => {
  console.log(`\n🚀 HabbUP Server corriendo en http://localhost:${PORT}`)
  console.log(`   API: http://localhost:${PORT}/api/changelog`)
  console.log(`   Admin: http://localhost:${PORT}/admin\n`)
})
