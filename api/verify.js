import { verifyToken, getTokenFromReq } from '../../lib/auth.js'

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (verifyToken(getTokenFromReq(req))) {
    return res.status(200).json({ ok: true })
  }
  res.status(401).json({ error: 'Token inválido o expirado' })
}

