import express             from 'express'
import { readChangelog, writeChangelog } from '../lib/data.js'
import { createToken, verifyToken, ADMIN_USER, ADMIN_PASS } from '../lib/auth.js'
import { randomUUID }      from 'crypto'
import path                from 'path'
import { fileURLToPath }   from 'url'
import fs                  from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app       = express()
const PORT      = process.env.PORT || 3001
const DIST      = path.join(__dirname, '..', 'dist')

app.use(express.json())
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, x-admin-token')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

const auth = (req, res, next) => {
  if (!verifyToken(req.headers['x-admin-token'] || '')) return res.status(401).json({ error: 'No autorizado' })
  next()
}

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body
  if (username === ADMIN_USER && password === ADMIN_PASS) return res.json({ token: createToken() })
  res.status(401).json({ error: 'Credenciales incorrectas' })
})

app.post('/api/auth/logout', (req, res) => res.json({ ok: true }))

app.get('/api/auth/verify', (req, res) => {
  verifyToken(req.headers['x-admin-token'] || '') ? res.json({ ok: true }) : res.status(401).json({ error: 'Token inválido' })
})

app.get('/api/changelog', (req, res) => {
  const data = readChangelog()
  res.json(data.sort((a, b) => new Date(b.date) - new Date(a.date)))
})

app.post('/api/changelog', auth, (req, res) => {
  const { version, date, type, title, description } = req.body
  if (!version || !date || !type || !title || !description) return res.status(400).json({ error: 'Todos los campos son requeridos' })
  const data = readChangelog()
  const entry = { id: randomUUID(), version, date, type, title, description, author: ADMIN_USER }
  data.push(entry)
  writeChangelog(data)
  res.status(201).json(entry)
})

app.put('/api/changelog/:id', auth, (req, res) => {
  const data = readChangelog()
  const idx = data.findIndex(e => e.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'No encontrado' })
  data[idx] = { ...data[idx], ...req.body, id: data[idx].id, author: ADMIN_USER }
  writeChangelog(data)
  res.json(data[idx])
})

app.delete('/api/changelog/:id', auth, (req, res) => {
  const data = readChangelog()
  const idx = data.findIndex(e => e.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'No encontrado' })
  data.splice(idx, 1)
  writeChangelog(data)
  res.json({ ok: true })
})

if (fs.existsSync(DIST)) {
  app.use(express.static(DIST))
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) res.sendFile(path.join(DIST, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`\n🚀 HabbUP API en http://localhost:${PORT}\n`)
})

