import { ADMIN_USER, ADMIN_PASS, createToken } from '../../lib/auth.js'

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { username, password } = req.body || {}
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    return res.status(200).json({ token: createToken() })
  }
  res.status(401).json({ error: 'Credenciales incorrectas' })
}

