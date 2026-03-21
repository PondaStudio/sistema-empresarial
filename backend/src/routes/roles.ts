import { Router } from 'express'
import { supabase } from '../lib/supabase'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.get('/', requireAuth, async (_req, res) => {
  const { data, error } = await supabase
    .from('roles')
    .select('id, nombre, nivel, descripcion')
    .order('nivel')
  if (error) return res.status(500).json({ error: 'DB_ERROR' })
  return res.json(data)
})

export default router
