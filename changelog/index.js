import { randomUUID }                    from 'crypto'
import { readChangelog, writeChangelog } from '../../lib/data.js'
import { verifyToken, getTokenFromReq, ADMIN_USER } from '../../lib/auth.js'

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token')
}

export default function handler(req, res) {
  cors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()

  // ── GET (public) ──────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const data = readChangelog()
    return res.status(200).json(data.sort((a, b) => new Date(b.date) - new Date(a.date)))
  }

  // ── POST (protected) ──────────────────────────────────────────────────────
  if (req.method === 'POST') {
    if (!verifyToken(getTokenFromReq(req))) {
      return res.status(401).json({ error: 'No autorizado' })
    }
    const { version, date, type, title, description } = req.body || {}
    if (!version || !date || !type || !title || !description) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' })
    }
    const data  = readChangelog()
    const entry = { id: randomUUID(), version, date, type, title, description, author: ADMIN_USER }
    data.push(entry)
    writeChangelog(data)
    return res.status(201).json(entry)
  }

  res.status(405).json({ error: 'Method not allowed' })
}

