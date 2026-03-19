/**
 * server.js — Servidor unificado para Hostinger
 *
 * Un solo proceso Node.js que sirve:
 *   - Frontend React (archivos estáticos desde /dist)
 *   - Backend Express (rutas bajo /api/*)
 *
 * Variables de entorno requeridas en .env (raíz):
 *   PORT, SUPABASE_URL, SUPABASE_SERVICE_KEY, FRONTEND_URL, etc.
 */

require('dotenv').config()

const express = require('express')
const path    = require('path')

// ── Backend compilado ────────────────────────────────────────────────────────
let backendApp
try {
  backendApp = require('./backend/dist/app').default
} catch (err) {
  console.error('[server] ❌ Backend no compilado. Ejecuta: npm run build')
  console.error(err.message)
  process.exit(1)
}

// ── Servidor principal ───────────────────────────────────────────────────────
const app = express()

// Todas las rutas /api/* → backend Express
// Express elimina automáticamente el prefijo /api al pasar al sub-app
app.use('/api', backendApp)

// Archivos estáticos del frontend (Vite build)
app.use(express.static(path.join(__dirname, 'dist')))

// SPA fallback — devuelve index.html para rutas del cliente (React Router)
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

// ── Arranque ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`[server] ✅ Puerto ${PORT} — frontend + API unificados`)
})
