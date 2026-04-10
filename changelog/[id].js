import { readChangelog, writeChangelog }           from '../../lib/data.js'
import { verifyToken, getTokenFromReq, ADMIN_USER } from '../../lib/auth.js'

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token')
}

export default function handler(req, res) {
  cors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (!verifyToken(getTokenFromReq(req))) {
    return res.status(401).json({ error: 'No autorizado' })
  }

  const { id } = req.query
  const data   = readChangelog()
  const idx    = data.findIndex(e => e.id === id)
  if (idx === -1) return res.status(404).json({ error: 'Registro no encontrado' })

  // ── PUT ───────────────────────────────────────────────────────────────────
  if (req.method === 'PUT') {
    data[idx] = { ...data[idx], ...req.body, id: data[idx].id, author: ADMIN_USER }
    writeChangelog(data)
    return res.status(200).json(data[idx])
  }

  // ── DELETE ────────────────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    data.splice(idx, 1)
    writeChangelog(data)
    return res.status(200).json({ ok: true })
  }

  res.status(405).json({ error: 'Method not allowed' })
}

