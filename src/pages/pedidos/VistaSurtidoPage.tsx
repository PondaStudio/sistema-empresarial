import { useEffect, useState } from 'react'
import { Package, Save, Search, CheckCircle2, QrCode } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Nota, ESTADO_LABELS, MOCK_NOTAS } from './types'
import { QRScanner } from '../../components/pedidos/QRScanner'

const ESTADOS_ITEM = ['pendiente', 'surtido', 'no_disponible', 'surtido_parcial'] as const
const AREAS_DEFAULT = ['A', 'B', 'C', 'D']

type Modo = 'surtir' | 'checar'

export default function VistaSurtidoPage() {
  const [modo, setModo] = useState<Modo>('surtir')

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Toggle de modo */}
      <div className="flex-shrink-0 px-4 md:px-6 pt-4 pb-0">
        <div className="inline-flex rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-1 gap-1">
          <button
            onClick={() => setModo('surtir')}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              modo === 'surtir'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Package size={14} /> Surtir pedido
          </button>
          <button
            onClick={() => setModo('checar')}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              modo === 'checar'
                ? 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <CheckCircle2 size={14} /> Checar piso
          </button>
        </div>
      </div>

      {/* Contenido del modo */}
      <div className="flex-1 min-h-0">
        {modo === 'surtir' ? <ModeSurtir /> : <ModeChecarPiso />}
      </div>
    </div>
  )
}

// ─── MODO 1: SURTIR PEDIDO ────────────────────────────────────────────────────
function ModeSurtir() {
  const [notas, setNotas] = useState<Nota[]>([])
  const [selected, setSelected] = useState<Nota | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [surtidoLocal, setSurtidoLocal] = useState<Record<string, { cantidad: number; estado: string; area: string }>>({})
  const [areas, setAreas] = useState<string[]>(AREAS_DEFAULT)

  useEffect(() => {
    api.get('/areas-bodega')
      .then(r => {
        const lista = Array.isArray(r.data) ? r.data.map((a: any) => a.nombre ?? a) : []
        if (lista.length > 0) setAreas(lista)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    api.get('/pedidos/venta?estados=capturada,en_surtido,surtido_parcial,completa_en_piso')
      .then(r => setNotas(Array.isArray(r.data) ? r.data : []))
      .catch(() => setNotas(MOCK_NOTAS.filter(n => ['capturada', 'en_surtido', 'surtido_parcial'].includes(n.estado))))
      .finally(() => setLoading(false))
  }, [])

  async function seleccionarNota(nota: Nota) {
    setLoadingDetalle(true)
    try {
      const { data } = await api.get(`/pedidos/venta/${nota.id}`)
      const detalle: Nota = data
      const init: Record<string, { cantidad: number; estado: string; area: string }> = {}
      ;(detalle.items ?? []).forEach(it => {
        init[it.id] = { cantidad: it.cantidad_surtida ?? 0, estado: it.estado_item ?? 'pendiente', area: it.area ?? '' }
      })
      setSurtidoLocal(init)
      setSelected(detalle)
    } catch (err: any) {
      if (err?.response?.status === 403) {
        toast.error('Sin permiso para ver esta nota')
      } else {
        setSelected(nota)
      }
    } finally {
      setLoadingDetalle(false)
    }
  }

  async function guardarSurtido() {
    if (!selected) return
    setSaving(true)

    const items = (selected.items ?? []).map(it => ({
      id: it.id,
      cantidad_surtida: surtidoLocal[it.id]?.cantidad ?? 0,
      estado_confirmacion: surtidoLocal[it.id]?.estado ?? it.estado_item ?? 'pendiente',
    }))

    const allSurtido = items.every(i => i.estado_confirmacion === 'surtido')
    const noneFound  = items.every(i => i.estado_confirmacion === 'no_disponible')
    const nuevoEstado = allSurtido ? 'completa_en_piso' : noneFound ? 'con_incidencia' : 'surtido_parcial'

    let errorOcurrido = false
    for (const it of items) {
      try {
        await api.patch(`/pedidos/venta/${selected.id}/surtir-item/${it.id}`, {
          cantidad_surtida:    it.cantidad_surtida,
          estado_confirmacion: it.estado_confirmacion,
          area:                surtidoLocal[it.id]?.area || undefined,
        })
      } catch (err: any) {
        console.error('[guardarSurtido] error en item', it.id, err?.response?.data ?? err?.message)
        errorOcurrido = true
      }
    }

    if (errorOcurrido) {
      toast.error('Algunos items no se pudieron guardar — revisa la consola')
    } else {
      toast.success('Surtido guardado')
    }

    setNotas(prev => prev.map(n => n.id === selected.id
      ? { ...n, estado: nuevoEstado as any, items: (n.items ?? []).map(it => ({
          ...it,
          cantidad_surtida: surtidoLocal[it.id]?.cantidad ?? it.cantidad_surtida,
          estado_item: (surtidoLocal[it.id]?.estado ?? it.estado_item) as any,
        })) }
      : n
    ))
    setSaving(false)
    setSelected(null)
  }

  const notasFiltradas = notas.filter(n =>
    n.folio.toLowerCase().includes(search.toLowerCase()) ||
    n.nombre_cliente.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="p-8 flex items-center gap-3 text-gray-400">
      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      Cargando cola de surtido...
    </div>
  )

  return (
    <div className="p-4 md:p-6 flex gap-5 h-full min-h-0">
      {/* Lista */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-2">
        <p className="text-xs text-gray-500 dark:text-gray-400">{notas.length} nota(s) pendiente(s)</p>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Buscar folio o cliente..." value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="space-y-1.5 overflow-y-auto flex-1">
          {notasFiltradas.map(n => {
            const est = ESTADO_LABELS[n.estado] ?? ESTADO_LABELS.capturada
            return (
              <button key={n.id} onClick={() => seleccionarNota(n)} disabled={loadingDetalle}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  selected?.id === n.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
                }`}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">{n.folio}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${est.color}`}>{est.label}</span>
                </div>
                <p className="text-xs text-gray-800 dark:text-white truncate">{n.nombre_cliente}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{(n.items ?? []).length} productos · {n.vendedora?.nombre}</p>
              </button>
            )
          })}
          {notasFiltradas.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-6">Sin notas en cola</p>
          )}
        </div>
      </div>

      {/* Panel surtido */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-y-auto min-h-0">
        {loadingDetalle ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Cargando detalle...</p>
          </div>
        ) : !selected ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
            <Package size={40} strokeWidth={1} />
            <p>Selecciona una nota para surtir</p>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold font-mono text-gray-900 dark:text-white">{selected.folio}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selected.nombre_cliente}</p>
                {selected.notas && <p className="text-xs text-gray-400 italic mt-1">"{selected.notas}"</p>}
              </div>
              <button onClick={guardarSurtido} disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors">
                <Save size={14} /> {saving ? 'Guardando...' : 'Guardar surtido'}
              </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="px-3 py-2 text-left w-24">Código</th>
                    <th className="px-3 py-2 text-left">Descripción</th>
                    <th className="px-3 py-2 text-center w-16">Pedido</th>
                    <th className="px-3 py-2 text-center w-20">Surtido</th>
                    <th className="px-3 py-2 text-center w-24">Área</th>
                    <th className="px-3 py-2 text-center w-36">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {(selected.items ?? []).map(item => {
                    const loc = surtidoLocal[item.id] ?? { cantidad: item.cantidad_surtida ?? 0, estado: item.estado_item ?? 'pendiente', area: item.area ?? '' }
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="px-3 py-2 font-mono text-xs text-gray-600 dark:text-gray-400">{item.codigo}</td>
                        <td className="px-3 py-2 text-gray-800 dark:text-gray-200">{item.nombre}</td>
                        <td className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300">{item.cantidad}</td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="number" min={0} max={item.cantidad}
                            value={loc.cantidad}
                            onChange={e => setSurtidoLocal(prev => ({
                              ...prev,
                              [item.id]: { ...loc, cantidad: Math.min(item.cantidad, Math.max(0, parseInt(e.target.value) || 0)) }
                            }))}
                            className="w-16 px-2 py-1 text-sm text-center border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <select
                            value={loc.area}
                            onChange={e => setSurtidoLocal(prev => ({ ...prev, [item.id]: { ...loc, area: e.target.value } }))}
                            className="text-xs px-2 py-1 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">—</option>
                            {areas.map(a => <option key={a} value={a}>{a}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <select
                            value={loc.estado}
                            onChange={e => setSurtidoLocal(prev => ({ ...prev, [item.id]: { ...loc, estado: e.target.value } }))}
                            className="text-xs px-2 py-1 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {ESTADOS_ITEM.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── MODO 2: CHECADOR DE PISO ─────────────────────────────────────────────────
function ModeChecarPiso() {
  const [notas, setNotas] = useState<Nota[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Nota | null>(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [search, setSearch] = useState('')
  const [showQR, setShowQR] = useState(false)
  const [verificados, setVerificados] = useState<Set<string>>(new Set())

  useEffect(() => {
    api.get('/pedidos/venta?estados=completa_en_piso')
      .then(r => setNotas(Array.isArray(r.data) ? r.data : []))
      .catch(() => setNotas([]))
      .finally(() => setLoading(false))
  }, [])

  async function buscarPorFolio(folio: string) {
    const limpio = folio.trim().toUpperCase()
    setSearch(limpio)
    // Buscar primero en la lista cargada
    const enLista = notas.find(n => n.folio.toUpperCase() === limpio)
    if (enLista) {
      cargarDetalle(enLista)
      return
    }
    // Si no está en lista, buscar en API
    setLoadingDetalle(true)
    try {
      const { data } = await api.get(`/pedidos/venta?folio=${encodeURIComponent(limpio)}`)
      const encontrada = Array.isArray(data) ? data[0] : null
      if (encontrada) {
        cargarDetalle(encontrada)
      } else {
        toast.error(`Nota ${limpio} no encontrada o no está completa en piso`)
        setLoadingDetalle(false)
      }
    } catch {
      toast.error('Error al buscar la nota')
      setLoadingDetalle(false)
    }
  }

  async function cargarDetalle(nota: Nota) {
    setLoadingDetalle(true)
    setVerificados(new Set())
    try {
      const { data } = await api.get(`/pedidos/venta/${nota.id}`)
      setSelected(data)
    } catch (err: any) {
      if (err?.response?.status === 403) {
        toast.error('Sin permiso para ver esta nota')
      } else {
        setSelected(nota)
      }
    } finally {
      setLoadingDetalle(false)
    }
  }

  function toggleVerificado(id: string) {
    setVerificados(prev => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id); else s.add(id)
      return s
    })
  }

  async function confirmarChecadaPiso() {
    if (!selected) return
    setProcessing(true)
    try {
      await api.patch(`/pedidos/venta/${selected.id}/checada-piso`)
      toast.success('✅ Checada en piso confirmada')
      setNotas(prev => prev.filter(n => n.id !== selected.id))
      setSelected(null)
      setSearch('')
    } catch {
      toast.success('✅ Checada en piso (demo)')
      setSelected(null)
      setSearch('')
    }
    setProcessing(false)
  }

  const notasFiltradas = notas.filter(n =>
    n.folio.toLowerCase().includes(search.toLowerCase()) ||
    n.nombre_cliente.toLowerCase().includes(search.toLowerCase())
  )
  const items = selected?.items ?? []
  const todosVerificados = items.length > 0 && items.every(it => verificados.has(it.id))

  if (loading) return (
    <div className="p-8 flex items-center gap-3 text-gray-400">
      <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      Cargando notas completas en piso...
    </div>
  )

  return (
    <div className="p-4 md:p-6 flex gap-5 h-full min-h-0">
      {showQR && (
        <QRScanner
          onScan={folio => { setShowQR(false); buscarPorFolio(folio) }}
          onClose={() => setShowQR(false)}
        />
      )}

      {/* Lista lateral */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-2">
        <p className="text-xs text-gray-500 dark:text-gray-400">{notas.length} nota(s) para checar</p>

        {/* Búsqueda + QR */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Folio..." value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && search.trim()) buscarPorFolio(search) }}
            />
          </div>
          <button
            onClick={() => setShowQR(true)}
            className="flex-shrink-0 p-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
            title="Escanear QR"
          >
            <QrCode size={14} />
          </button>
        </div>

        <div className="space-y-1.5 overflow-y-auto flex-1">
          {notasFiltradas.map(n => (
            <button key={n.id} onClick={() => { setSearch(n.folio); cargarDetalle(n) }} disabled={loadingDetalle}
              className={`w-full text-left p-3 rounded-xl border transition-all ${
                selected?.id === n.id
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
              }`}>
              <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">{n.folio}</span>
              <p className="text-xs text-gray-800 dark:text-white truncate mt-0.5">{n.nombre_cliente}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{(n.items ?? []).length} productos</p>
            </button>
          ))}
          {notasFiltradas.length === 0 && !loadingDetalle && (
            <p className="text-xs text-gray-400 text-center py-6">Sin notas completas en piso</p>
          )}
        </div>
      </div>

      {/* Panel de verificación */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-y-auto min-h-0">
        {loadingDetalle ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
            <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Cargando nota...</p>
          </div>
        ) : !selected ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
            <CheckCircle2 size={40} strokeWidth={1} />
            <p className="text-sm">Selecciona o escanea una nota para checar</p>
            <button onClick={() => setShowQR(true)}
              className="mt-2 flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <QrCode size={14} /> Escanear QR
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Encabezado */}
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-lg font-bold font-mono text-gray-900 dark:text-white">{selected.folio}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selected.nombre_cliente}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Agente: {selected.vendedora?.numero_agente ?? '—'} · {selected.vendedora?.nombre}
                </p>
              </div>
              <button onClick={confirmarChecadaPiso} disabled={processing || !todosVerificados}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <CheckCircle2 size={14} />
                {processing ? 'Procesando...' : 'Confirmar checada en piso'}
              </button>
            </div>

            {!todosVerificados && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Marca todos los productos como verificados para confirmar
              </p>
            )}

            {/* Lista de productos con checkboxes */}
            <div className="space-y-2">
              {items.map(item => {
                const checked = verificados.has(item.id)
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleVerificado(item.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                      checked
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      checked
                        ? 'border-green-500 bg-green-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {checked && (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium transition-colors ${checked ? 'text-green-700 dark:text-green-400' : 'text-gray-800 dark:text-gray-200'}`}>
                        {item.nombre}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {item.codigo} · Cant: {item.cantidad} · Área: {item.area ?? '—'}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      checked ? 'bg-green-100 text-green-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}>
                      {checked ? '✓ OK' : 'Pendiente'}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="text-xs text-gray-400 text-right">
              {verificados.size} / {items.length} verificados
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
