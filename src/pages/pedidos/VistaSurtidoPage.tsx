import { useEffect, useState } from 'react'
import { Package, Save, Search, CheckCircle2, QrCode, DoorOpen } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Nota, ESTADO_LABELS, MOCK_NOTAS } from './types'
import EscanerCamara from '../../components/common/EscanerCamara'

const AREAS_DEFAULT = ['A', 'B', 'C', 'D']

function badgeItem(surtida: number, pedida: number) {
  if (surtida >= pedida) return { code: 'S',  color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' }
  if (surtida > 0)       return { code: 'SP', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' }
  return                        { code: 'NS', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
}

function estadoItemFromBadge(surtida: number, pedida: number): string {
  if (surtida >= pedida) return 'surtido'
  if (surtida > 0)       return 'surtido_parcial'
  return 'no_disponible'
}

type Modo = 'surtir' | 'checar_piso' | 'checar_puerta'

function cantidadARevisar(total: number): number {
  if (total <= 5)  return 1
  if (total <= 10) return 2
  if (total <= 20) return 3
  if (total <= 40) return 4
  return 5
}

export default function VistaSurtidoPage() {
  return <AlmacenistaLayout />
}

function AlmacenistaLayout() {
  const [modo, setModo] = useState<Modo>('surtir')

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Tabs */}
      <div className="flex-shrink-0 px-4 md:px-6 pt-4 pb-0">
        <div className="inline-flex rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-1 gap-1">
          <button
            onClick={() => setModo('surtir')}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
              modo === 'surtir'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}>
            <Package size={14} /> Surtir pedido
          </button>
          <button
            onClick={() => setModo('checar_piso')}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
              modo === 'checar_piso'
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}>
            <CheckCircle2 size={14} /> Checar piso
          </button>
          <button
            onClick={() => setModo('checar_puerta')}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
              modo === 'checar_puerta'
                ? 'bg-white dark:bg-gray-700 text-violet-600 dark:text-violet-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}>
            <DoorOpen size={14} /> Checar puerta
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {modo === 'surtir'        && <ModeSurtir />}
        {modo === 'checar_piso'   && <ModeChecarPiso />}
        {modo === 'checar_puerta' && <ModeChecarPuerta />}
      </div>
    </div>
  )
}

// ─── MODO 1: SURTIR ──────────────────────────────────────────────────────────
function ModeSurtir() {
  const [notas, setNotas] = useState<Nota[]>([])
  const [selected, setSelected] = useState<Nota | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [surtidoLocal, setSurtidoLocal] = useState<Record<string, { cantidad: number; area: string }>>({})
  const [areas, setAreas] = useState<string[]>(AREAS_DEFAULT)
  const [mobileShowDetail, setMobileShowDetail] = useState(false)

  useEffect(() => {
    api.get('/areas-bodega')
      .then(r => {
        const lista = Array.isArray(r.data) ? r.data.map((a: any) => a.nombre ?? a) : []
        if (lista.length > 0) setAreas(lista)
      }).catch(() => {})
  }, [])

  useEffect(() => {
    api.get('/pedidos/venta?estados=capturada,en_surtido,surtido_parcial,completa_en_piso')
      .then(r => setNotas(Array.isArray(r.data) ? r.data : []))
      .catch(() => setNotas(MOCK_NOTAS.filter(n => ['capturada', 'en_surtido', 'surtido_parcial'].includes(n.estado))))
      .finally(() => setLoading(false))
  }, [])

  async function seleccionarNota(nota: Nota) {
    setLoadingDetalle(true)
    setMobileShowDetail(true)
    try {
      const { data } = await api.get(`/pedidos/venta/${nota.id}`)
      const detalle: Nota = data
      const init: Record<string, { cantidad: number; area: string }> = {}
      ;(detalle.items ?? []).forEach(it => {
        // Iniciar con la cantidad pedida; el almacenista solo modifica si hay faltantes
        init[it.id] = { cantidad: it.cantidad, area: it.area ?? '' }
      })
      setSurtidoLocal(init)
      setSelected(detalle)
    } catch (err: any) {
      if (err?.response?.status === 403) toast.error('Sin permiso para ver esta nota')
      else setSelected(nota)
    } finally {
      setLoadingDetalle(false)
    }
  }

  async function guardarSurtido() {
    if (!selected) return
    setSaving(true)

    const items = (selected.items ?? []).map(it => {
      const loc = surtidoLocal[it.id] ?? { cantidad: it.cantidad, area: it.area ?? '' }
      return {
        id:                  it.id,
        cantidad_surtida:    loc.cantidad,
        estado_confirmacion: estadoItemFromBadge(loc.cantidad, it.cantidad),
        area:                loc.area || undefined,
      }
    })

    const allSurtido = items.every(i => i.estado_confirmacion === 'surtido')
    const nuevoEstado = allSurtido ? 'completa_en_piso' : 'devuelta_vendedora'

    let errorOcurrido = false
    for (const it of items) {
      try {
        await api.patch(`/pedidos/venta/${selected.id}/surtir-item/${it.id}`, {
          cantidad_surtida:    it.cantidad_surtida,
          estado_confirmacion: it.estado_confirmacion,
          area:                it.area,
        })
      } catch (err: any) {
        console.error('[guardarSurtido] error en item', it.id, err?.response?.data ?? err?.message)
        errorOcurrido = true
      }
    }

    // Actualizar estado de la nota
    try {
      await api.patch(`/pedidos/venta/${selected.id}/estado`, { estado: nuevoEstado })
    } catch (err: any) {
      console.error('[guardarSurtido] error actualizando estado nota', err?.response?.data ?? err?.message)
    }

    if (errorOcurrido) toast.error('Algunos items no se pudieron guardar')
    else if (nuevoEstado === 'devuelta_vendedora') toast('Nota devuelta a vendedora por faltantes', { icon: '⚠️' })
    else toast.success('✅ Surtido completo — nota lista para validación en piso')

    setNotas(prev => prev.map(n => n.id === selected.id
      ? { ...n, estado: nuevoEstado as any }
      : n
    ))
    setSaving(false)
    setSelected(null)
    setMobileShowDetail(false)
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
    <div className="p-4 md:p-6 flex flex-col md:flex-row gap-5 h-full min-h-0">
      {/* Lista — full width on mobile, hidden when detail shown */}
      <div className={`${mobileShowDetail ? 'hidden' : 'flex'} md:flex flex-col w-full md:w-72 md:flex-shrink-0 gap-2 min-h-0`}>
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
          {notasFiltradas.length === 0 && <p className="text-xs text-gray-400 text-center py-6">Sin notas en cola</p>}
        </div>
      </div>

      {/* Detail — full screen on mobile when shown */}
      <div className={`${mobileShowDetail ? 'flex' : 'hidden'} md:flex flex-col flex-1 min-h-0`}>
        {/* Mobile back button */}
        <button
          onClick={() => { setMobileShowDetail(false); setSelected(null) }}
          className="md:hidden flex items-center gap-1 text-sm text-blue-600 mb-3 min-h-[44px]"
        >
          ← Volver
        </button>
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
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-lg font-bold font-mono text-gray-900 dark:text-white">{selected.folio}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selected.nombre_cliente}</p>
                {selected.notas && <p className="text-xs text-gray-400 italic mt-1">"{selected.notas}"</p>}
              </div>
              <button onClick={guardarSurtido} disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 min-h-[44px] text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors">
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
                    <th className="px-3 py-2 text-center w-16">Est.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {(selected.items ?? []).map(item => {
                    const loc = surtidoLocal[item.id] ?? { cantidad: item.cantidad, area: item.area ?? '' }
                    const badge = badgeItem(loc.cantidad, item.cantidad)
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="px-3 py-2 font-mono text-xs text-gray-600 dark:text-gray-400">{item.codigo}</td>
                        <td className="px-3 py-2 text-gray-800 dark:text-gray-200">{item.nombre}</td>
                        <td className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300">{item.cantidad}</td>
                        <td className="px-3 py-2 text-center">
                          <input type="number" min={0} max={item.cantidad} value={loc.cantidad}
                            onFocus={e => e.target.select()}
                            onChange={e => setSurtidoLocal(prev => ({ ...prev, [item.id]: { ...loc, cantidad: Math.min(item.cantidad, Math.max(0, parseInt(e.target.value) || 0)) } }))}
                            className="w-16 px-2 py-1 text-sm text-center border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <select value={loc.area}
                            onChange={e => setSurtidoLocal(prev => ({ ...prev, [item.id]: { ...loc, area: e.target.value } }))}
                            className="text-xs px-2 py-1 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">—</option>
                            {areas.map(a => <option key={a} value={a}>{a}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full ${badge.color}`}>
                            {badge.code}
                          </span>
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
    </div>
  )
}

// ─── MODO 2: CHECAR PISO (cobradas → checada_en_piso) ─────────────────────────
function ModeChecarPiso() {
  const [notas, setNotas]             = useState<Nota[]>([])
  const [loading, setLoading]         = useState(true)
  const [selected, setSelected]       = useState<Nota | null>(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [processing, setProcessing]   = useState(false)
  const [search, setSearch]           = useState('')
  const [showQR, setShowQR]           = useState(false)
  const [verificados, setVerificados] = useState<Set<string>>(new Set())
  const [mobileShowDetail, setMobileShowDetail] = useState(false)

  const cargarLista = () =>
    api.get('/pedidos/venta?estados=cobrada')
      .then(r => setNotas(Array.isArray(r.data) ? r.data : []))
      .catch(() => setNotas([]))

  useEffect(() => { cargarLista().finally(() => setLoading(false)) }, [])

  async function buscarPorFolio(folio: string) {
    const limpio = folio.trim().toUpperCase()
    setSearch(limpio)
    const enLista = notas.find(n => n.folio.toUpperCase() === limpio)
    if (enLista) { cargarDetalle(enLista); return }
    setLoadingDetalle(true)
    try {
      const { data } = await api.get(`/pedidos/venta?folio=${encodeURIComponent(limpio)}`)
      const encontrada = Array.isArray(data) ? data[0] : null
      if (encontrada) cargarDetalle(encontrada)
      else { toast.error(`Nota ${limpio} no encontrada`); setLoadingDetalle(false) }
    } catch { toast.error('Error al buscar'); setLoadingDetalle(false) }
  }

  async function cargarDetalle(nota: Nota) {
    setLoadingDetalle(true)
    setVerificados(new Set())
    setMobileShowDetail(true)
    try {
      const { data } = await api.get(`/pedidos/venta/${nota.id}`)
      setSelected(data)
    } catch (err: any) {
      if (err?.response?.status === 403) toast.error('Sin permiso para ver esta nota')
      else setSelected(nota)
    } finally { setLoadingDetalle(false) }
  }

  function toggleVerificado(id: string) {
    setVerificados(prev => { const s = new Set(prev); if (s.has(id)) s.delete(id); else s.add(id); return s })
  }

  async function confirmarChecadaPiso() {
    if (!selected) return
    const notaId = selected.id
    setProcessing(true)
    console.log('[ModeChecarPiso] PATCH /checada-piso', { notaId })
    try {
      await api.patch(`/pedidos/venta/${notaId}/checada-piso`)
      toast.success('✅ Checada en piso confirmada')
      setSelected(null)
      setVerificados(new Set())
      setSearch('')
      setMobileShowDetail(false)
      await cargarLista()
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message ?? 'Error desconocido'
      console.error('[ModeChecarPiso]', err?.response?.status, err?.response?.data)
      toast.error(`Error: ${msg}`, { duration: 6000 })
    } finally { setProcessing(false) }
  }

  const filtradas = notas.filter(n =>
    n.folio.toLowerCase().includes(search.toLowerCase()) ||
    n.nombre_cliente.toLowerCase().includes(search.toLowerCase())
  )
  const items = selected?.items ?? []
  const todosVerificados = items.length > 0 && items.every(it => verificados.has(it.id))

  if (loading) return (
    <div className="p-8 flex items-center gap-3 text-gray-400">
      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      Cargando notas cobradas...
    </div>
  )

  return (
    <div className="p-4 md:p-6 flex flex-col md:flex-row gap-5 h-full min-h-0">
      {showQR && <EscanerCamara modo="qr" onScan={f => { setShowQR(false); buscarPorFolio(f) }} onClose={() => setShowQR(false)} />}
      {/* Lista */}
      <div className={`${mobileShowDetail ? 'hidden' : 'flex'} md:flex flex-col w-full md:w-72 md:flex-shrink-0 gap-2 min-h-0`}>
        <p className="text-xs text-gray-500 dark:text-gray-400">{notas.length} nota(s) cobrada(s)</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Folio..." value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && search.trim()) buscarPorFolio(search) }} />
          </div>
          <button onClick={() => setShowQR(true)} className="flex-shrink-0 p-2 min-h-[44px] rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"><QrCode size={14} /></button>
        </div>
        <div className="space-y-1.5 overflow-y-auto flex-1">
          {filtradas.map(n => (
            <button key={n.id} onClick={() => { setSearch(n.folio); cargarDetalle(n) }} disabled={loadingDetalle}
              className={`w-full text-left p-3 rounded-xl border transition-all ${selected?.id === n.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'}`}>
              <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">{n.folio}</span>
              <p className="text-xs text-gray-800 dark:text-white truncate mt-0.5">{n.nombre_cliente}</p>
            </button>
          ))}
          {filtradas.length === 0 && !loadingDetalle && (
            <div className="text-center py-6 space-y-3">
              <p className="text-xs text-gray-400">Sin notas cobradas</p>
              <button onClick={() => setShowQR(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors mx-auto"><QrCode size={14} /> Escanear QR</button>
            </div>
          )}
        </div>
      </div>
      {/* Detail */}
      <div className={`${mobileShowDetail ? 'flex' : 'hidden'} md:flex flex-col flex-1 min-h-0`}>
        <button onClick={() => { setMobileShowDetail(false); setSelected(null) }} className="md:hidden flex items-center gap-1 text-sm text-indigo-600 mb-3 min-h-[44px]">← Volver</button>
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-y-auto min-h-0">
        {loadingDetalle ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /><p className="text-sm">Cargando...</p>
          </div>
        ) : !selected ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
            <CheckCircle2 size={40} strokeWidth={1} /><p className="text-sm">Selecciona o escanea una nota</p>
            <button onClick={() => setShowQR(true)} className="mt-2 flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"><QrCode size={14} /> Escanear QR</button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-lg font-bold font-mono text-gray-900 dark:text-white">{selected.folio}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selected.nombre_cliente}</p>
              </div>
              <button onClick={confirmarChecadaPiso} disabled={processing || !todosVerificados}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <CheckCircle2 size={14} />{processing ? 'Procesando...' : 'Confirmar checada en piso'}
              </button>
            </div>
            {!todosVerificados && <p className="text-xs text-amber-600 dark:text-amber-400">Marca todos los productos para confirmar</p>}
            <div className="space-y-2">
              {items.map(item => {
                const checked = verificados.has(item.id)
                return (
                  <button key={item.id} onClick={() => toggleVerificado(item.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${checked ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'}`}>
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${checked ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300 dark:border-gray-600'}`}>
                      {checked && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${checked ? 'text-indigo-700 dark:text-indigo-400' : 'text-gray-800 dark:text-gray-200'}`}>{item.nombre}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.codigo} · Cant: {item.cantidad} · Área: {item.area ?? '—'}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${checked ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                      {checked ? '✓ OK' : 'Pendiente'}
                    </span>
                  </button>
                )
              })}
            </div>
            <div className="text-xs text-gray-400 text-right">{verificados.size} / {items.length} verificados</div>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}

// ─── MODO 3: CHECAR PUERTA (checada_en_piso → checada_en_salida) ──────────────
function ModeChecarPuerta() {
  const [notas, setNotas]             = useState<Nota[]>([])
  const [loading, setLoading]         = useState(true)
  const [selected, setSelected]       = useState<Nota | null>(null)
  const [muestraItems, setMuestraItems] = useState<any[]>([])
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [processing, setProcessing]   = useState(false)
  const [cerrando, setCerrando]       = useState(false)
  const [search, setSearch]           = useState('')
  const [showQR, setShowQR]           = useState(false)
  const [verificados, setVerificados] = useState<Set<string>>(new Set())
  const [salidaConfirmada, setSalidaConfirmada] = useState<string | null>(null)
  const [mobileShowDetail, setMobileShowDetail] = useState(false)

  const cargarLista = () =>
    api.get('/pedidos/venta?estados=checada_en_piso')
      .then(r => setNotas(Array.isArray(r.data) ? r.data : []))
      .catch(() => setNotas([]))

  useEffect(() => { cargarLista().finally(() => setLoading(false)) }, [])

  async function buscarPorFolio(folio: string) {
    const limpio = folio.trim().toUpperCase()
    setSearch(limpio)
    const enLista = notas.find(n => n.folio.toUpperCase() === limpio)
    if (enLista) { cargarDetalle(enLista); return }
    setLoadingDetalle(true)
    try {
      const { data } = await api.get(`/pedidos/venta?folio=${encodeURIComponent(limpio)}`)
      const encontrada = Array.isArray(data) ? data[0] : null
      if (encontrada) cargarDetalle(encontrada)
      else { toast.error(`Nota ${limpio} no encontrada`); setLoadingDetalle(false) }
    } catch { toast.error('Error al buscar'); setLoadingDetalle(false) }
  }

  async function cargarDetalle(nota: Nota) {
    setLoadingDetalle(true)
    setVerificados(new Set())
    setSalidaConfirmada(null)
    setMobileShowDetail(true)
    try {
      const { data } = await api.get(`/pedidos/venta/${nota.id}`)
      setSelected(data)
      const todos = data.items ?? []
      const n = cantidadARevisar(todos.length)
      const shuffled = [...todos].sort(() => Math.random() - 0.5)
      setMuestraItems(shuffled.slice(0, n))
    } catch (err: any) {
      if (err?.response?.status === 403) toast.error('Sin permiso para ver esta nota')
      else { setSelected(nota); setMuestraItems([]) }
    } finally { setLoadingDetalle(false) }
  }

  function toggleVerificado(id: string) {
    setVerificados(prev => { const s = new Set(prev); if (s.has(id)) s.delete(id); else s.add(id); return s })
  }

  async function confirmarSalida() {
    if (!selected) return
    const notaId = selected.id
    setProcessing(true)
    console.log('[ModeChecarPuerta] PATCH /checada-salida', { notaId })
    try {
      await api.patch(`/pedidos/venta/${notaId}/checada-salida`)
      toast.success('✅ Salida confirmada')
      setSalidaConfirmada(notaId)
      await cargarLista()
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message ?? 'Error desconocido'
      console.error('[ModeChecarPuerta]', err?.response?.status, err?.response?.data)
      toast.error(`Error: ${msg}`, { duration: 6000 })
    } finally { setProcessing(false) }
  }

  async function cerrarNota() {
    if (!selected) return
    const notaId = selected.id
    setCerrando(true)
    try {
      await api.patch(`/pedidos/venta/${notaId}/cerrar`)
      toast.success('Nota cerrada definitivamente')
      setSelected(null)
      setSalidaConfirmada(null)
      setSearch('')
      setMobileShowDetail(false)
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.response?.data?.error ?? 'Error'
      toast.error(`Error al cerrar: ${msg}`, { duration: 5000 })
    } finally { setCerrando(false) }
  }

  const filtradas = notas.filter(n =>
    n.folio.toLowerCase().includes(search.toLowerCase()) ||
    n.nombre_cliente.toLowerCase().includes(search.toLowerCase())
  )
  const todosVerificados = muestraItems.length > 0 && muestraItems.every((it: any) => verificados.has(it.id))

  if (loading) return (
    <div className="p-8 flex items-center gap-3 text-gray-400">
      <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      Cargando notas para checar puerta...
    </div>
  )

  return (
    <div className="p-4 md:p-6 flex flex-col md:flex-row gap-5 h-full min-h-0">
      {showQR && <EscanerCamara modo="qr" onScan={f => { setShowQR(false); buscarPorFolio(f) }} onClose={() => setShowQR(false)} />}
      {/* Lista */}
      <div className={`${mobileShowDetail ? 'hidden' : 'flex'} md:flex flex-col w-full md:w-72 md:flex-shrink-0 gap-2 min-h-0`}>
        <p className="text-xs text-gray-500 dark:text-gray-400">{notas.length} nota(s) checada(s) en piso</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="Folio..." value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && search.trim()) buscarPorFolio(search) }} />
          </div>
          <button onClick={() => setShowQR(true)} className="flex-shrink-0 p-2 min-h-[44px] rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors"><QrCode size={14} /></button>
        </div>
        <div className="space-y-1.5 overflow-y-auto flex-1">
          {filtradas.map(n => (
            <button key={n.id} onClick={() => { setSearch(n.folio); cargarDetalle(n) }} disabled={loadingDetalle}
              className={`w-full text-left p-3 rounded-xl border transition-all ${selected?.id === n.id ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'}`}>
              <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">{n.folio}</span>
              <p className="text-xs text-gray-800 dark:text-white truncate mt-0.5">{n.nombre_cliente}</p>
            </button>
          ))}
          {filtradas.length === 0 && !loadingDetalle && (
            <div className="text-center py-6 space-y-3">
              <p className="text-xs text-gray-400">Sin notas para checar puerta</p>
              <button onClick={() => setShowQR(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors mx-auto"><QrCode size={14} /> Escanear QR</button>
            </div>
          )}
        </div>
      </div>
      {/* Detail */}
      <div className={`${mobileShowDetail ? 'flex' : 'hidden'} md:flex flex-col flex-1 min-h-0`}>
        <button onClick={() => { setMobileShowDetail(false); setSelected(null) }} className="md:hidden flex items-center gap-1 text-sm text-violet-600 mb-3 min-h-[44px]">← Volver</button>
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-y-auto min-h-0">
        {loadingDetalle ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /><p className="text-sm">Cargando...</p>
          </div>
        ) : !selected ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
            <DoorOpen size={40} strokeWidth={1} /><p className="text-sm">Selecciona o escanea una nota</p>
            <button onClick={() => setShowQR(true)} className="mt-2 flex items-center gap-2 px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"><QrCode size={14} /> Escanear QR</button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-lg font-bold font-mono text-gray-900 dark:text-white">{selected.folio}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selected.nombre_cliente}</p>
              </div>
              {salidaConfirmada ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-600 font-medium flex items-center gap-1"><CheckCircle2 size={14} /> Salida confirmada</span>
                  <button onClick={cerrarNota} disabled={cerrando}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors">
                    {cerrando ? 'Cerrando...' : 'Cerrar nota definitivamente'}
                  </button>
                </div>
              ) : (
                <button onClick={confirmarSalida} disabled={processing || !todosVerificados}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  <CheckCircle2 size={14} />{processing ? 'Procesando...' : 'Confirmar salida'}
                </button>
              )}
            </div>
            <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg px-3 py-2">
              <p className="text-xs text-violet-700 dark:text-violet-400 font-medium">
                Verificación rápida — revisa {muestraItems.length} de {(selected.items ?? []).length} productos
              </p>
              {!salidaConfirmada && !todosVerificados && <p className="text-xs text-violet-600 mt-0.5">Marca todos para confirmar</p>}
            </div>
            <div className="space-y-2">
              {muestraItems.map((item: any) => {
                const checked = verificados.has(item.id)
                return (
                  <button key={item.id} onClick={() => { if (!salidaConfirmada) toggleVerificado(item.id) }}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                      salidaConfirmada ? 'border-green-400 bg-green-50 dark:bg-green-900/20 cursor-default'
                      : checked ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
                    }`}>
                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      salidaConfirmada ? 'border-green-500 bg-green-500' : checked ? 'border-violet-500 bg-violet-500' : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {(checked || salidaConfirmada) && <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-base font-semibold ${salidaConfirmada ? 'text-green-700 dark:text-green-400' : checked ? 'text-violet-700 dark:text-violet-400' : 'text-gray-800 dark:text-gray-200'}`}>{item.nombre}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.codigo} · Cant: {item.cantidad} · Área: {item.area ?? '—'}</p>
                    </div>
                    <span className={`text-sm font-bold px-3 py-1 rounded-full flex-shrink-0 ${
                      salidaConfirmada ? 'bg-green-100 text-green-700' : checked ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                    }`}>{(checked || salidaConfirmada) ? '✓' : '○'}</span>
                  </button>
                )
              })}
            </div>
            {!salidaConfirmada && <div className="text-xs text-gray-400 text-right">{verificados.size} / {muestraItems.length} verificados</div>}
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
