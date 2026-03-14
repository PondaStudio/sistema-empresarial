import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { config } from 'dotenv'

config()

const app = express()

// Security
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
}))

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'backend' })
})

// Wave 1 routes
import authRoutes       from './routes/auth'
import usersRoutes      from './routes/users'
import sucursalesRoutes from './routes/sucursales'
import permisosRoutes   from './routes/permisos'
import rolesRoutes      from './routes/roles'

app.use('/auth',        authRoutes)
app.use('/users',       usersRoutes)
app.use('/sucursales',  sucursalesRoutes)
app.use('/permisos',    permisosRoutes)
app.use('/roles',       rolesRoutes)

export default app
