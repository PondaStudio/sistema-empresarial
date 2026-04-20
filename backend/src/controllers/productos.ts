import { Response } from 'express'
import { supabase } from '../lib/supabase'
import { z } from 'zod'
import { AuthRequest } from '../middleware/auth'

export async function listProductos(req: AuthRequest, res: Response) {
  const { q, search, categoria_id, codigo, activo = 'true' } = req.query as Record<string, string>

  // search param: busca por código O nombre, ordena por relevancia (starts-with primero)
  if (search) {
    const term = search.trim()
    const lower = term.toLowerCase()
    const { data, error } = await supabase
      .from('productos')
      .select('id, codigo, nombre')
      .eq('activo', true)
      .or(`codigo.ilike.%${term}%,nombre.ilike.%${term}%`)
      .limit(40)
    if (error) return res.status(500).json({ error: 'DB_ERROR' })
    const sorted = (data ?? []).sort((a: any, b: any) => {
      const aStarts = a.codigo.toLowerCase().startsWith(lower) || a.nombre.toLowerCase().startsWith(lower)
      const bStarts = b.codigo.toLowerCase().startsWith(lower) || b.nombre.toLowerCase().startsWith(lower)
      if (aStarts && !bStarts) return -1
      if (!aStarts && bStarts) return 1
      return 0
    }).slice(0, 20)
    return res.json(sorted)
  }

  // codigo param: búsqueda exacta por código (legacy, usado internamente)
  if (codigo) {
    const { data, error } = await supabase
      .from('productos')
      .select('id, codigo, nombre, descripcion, foto_url')
      .eq('activo', true)
      .ilike('codigo', codigo)
      .limit(5)
    if (error) return res.status(500).json({ error: 'DB_ERROR' })
    return res.json(data)
  }

  let query = supabase
    .from('productos')
    .select('id, codigo, nombre, descripcion, foto_url, activo, categoria_id, categorias(nombre)')
    .eq('activo', activo === 'true')
    .order('nombre')

  if (q) query = query.ilike('nombre', `%${q}%`)
  if (categoria_id) query = query.eq('categoria_id', categoria_id)

  const { data, error } = await query
  if (error) return res.status(500).json({ error: 'DB_ERROR' })
  return res.json(data)
}

const productoSchema = z.object({
  codigo:       z.string().min(1).max(100),
  nombre:       z.string().min(1).max(300),
  categoria_id: z.string().uuid().optional(),
  descripcion:  z.string().optional(),
  foto_url:     z.string().url().optional(),
})

export async function createProducto(req: AuthRequest, res: Response) {
  const parsed = productoSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })

  const { data, error } = await supabase.from('productos').insert(parsed.data).select().single()
  if (error?.code === '23505') return res.status(409).json({ error: 'CODIGO_DUPLICADO' })
  if (error) return res.status(500).json({ error: 'CREATE_FAILED' })
  return res.status(201).json(data)
}

export async function updateProducto(req: AuthRequest, res: Response) {
  const parsed = productoSchema.partial().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })

  const { error } = await supabase.from('productos').update(parsed.data).eq('id', req.params.id)
  if (error) return res.status(500).json({ error: 'UPDATE_FAILED' })
  return res.json({ message: 'Producto actualizado' })
}

export async function getExtraTabCodes(req: AuthRequest, res: Response) {
  const { data, error } = await supabase
    .from('productos')
    .select('codigo')
    .eq('activo', true)
    .eq('extra_tab', true)
  if (error) return res.status(500).json({ error: 'DB_ERROR' })
  return res.json((data ?? []).map((p: any) => p.codigo))
}
