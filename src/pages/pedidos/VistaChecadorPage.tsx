import { useEffect, useState } from 'react'
import { Search, ScanLine, CheckCircle2, QrCode } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { Nota, MOCK_NOTAS } from './types'
import { QRScanner } from '../../components/pedidos/QRScanner'

export default function VistaChecadorPage() {
  const subtipo = useAuthStore(s => s.user?.subtipo ?? 'checador_escaner')
  if (subtipo === 'checador_rapido') return <CheckadorRapido />
  return <CheckadorEscaner />
}

// ─── Fórmula de muestreo aleatorio ────────────────────────────────────────────
function cantidadARevisar(total: number): number {
  if (total <= 5)  return 1
  if (total <= 10) return 2
  if (total <= 20) return 3
  if (total <= 40) return 4
  return 5
}

// ─── Checador Escáner: notas cobradas → checada en piso ───────────────────────
function CheckadorEscaner() {
  const [notas, setNotas]               = useState<Nota[]>([])
  const [selected, setSelected]         = useState<Nota | null>(null)
  const [search, setSearch]             = useState('')
  const [loading, setLoading]           = useState(true)
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [processing, setProcessing]     = useState(false)
  const [showQR, setShowQR]             = useState(false)
  const [verificados, setVerificados]   = useState<Set<string>>(new Set())

  useEffect(() => {
    api.get('/pedidos/venta?estados=cobrada')
      .then(r => setNotas(Array.isArray(r.data) ? r.data : []))
      .catch(() => setNotas(MOCK_NOTAS.filter(n => n.estado === 'cobrada')))
      .finally(() => setLoading(false))
  }, [])

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
      if (err?.response?.status === 403) toast.error('Sin permiso para ver esta nota')
      else setSelected(nota)
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
    console.log('[CheckadorEscaner] PATCH /checada-piso', { id: selected.id, token: api.defaults.headers.common?.['Authorization'] })
    try {
      await api.patch(`/pedidos/venta/${selected.id}/checada-piso`)
      toast.success('✅ Checada en piso confirmada')
      setNotas(prev => prev.filter(n => n.id !== selected.id))
      setSelected(null)
      setSearch('')
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message ?? 'Error desconocido'
      console.error('[CheckadorEscaner] Error en /checada-piso:', err?.response?.data ?? err)
      toast.error(`Error: ${msg}`, { duration: 5000 })
    }
    setProcessing(false)
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
      Cargando checador escáner...
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

      {/* Lista */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-2">
        <h1 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ScanLine size={18} className="text-indigo-500" /> Checador Escáner
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">{notas.length} nota(s) cobrada(s)</p>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Folio o cliente..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && search.trim()) buscarPorFolio(search) }}
            />
          </div>
          <button
            onClick={() => setShowQR(true)}
            className="flex-shrink-0 p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            title="Escanear QR"
          >
            <QrCode size={14} />
          </button>
        </div>

        <div className="space-y-1.5 overflow-y-auto flex-1">
          {filtradas.map(n => (
            <button key={n.id} onClick={() => { setSearch(n.folio); cargarDetalle(n) }} disabled={loadingDetalle}
              className={`w-full text-left p-3 rounded-xl border transition-all ${
                selected?.id === n.id
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
              }`}>
              <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">{n.folio}</span>
              <p className="text-xs text-gray-800 dark:text-white truncate mt-0.5">{n.nombre_cliente}</p>
            </button>
          ))}
          {filtradas.length === 0 && !loadingDetalle && (
            <p className="text-xs text-gray-400 text-center py-6">Sin notas cobradas</p>
          )}
        </div>
      </div>

      {/* Panel verificación */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-y-auto min-h-0">
        {loadingDetalle ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Cargando detalle...</p>
          </div>
        ) : !selected ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
            <ScanLine size={40} strokeWidth={1} />
            <p className="text-sm">Selecciona o escanea una nota para revisar</p>
            <button onClick={() => setShowQR(true)}
              className="mt-2 flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <QrCode size={14} /> Escanear QR
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-lg font-bold font-mono text-gray-900 dark:text-white">{selected.folio}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selected.nombre_cliente}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Agente: {selected.vendedora?.numero_agente ?? '—'} · {selected.vendedora?.nombre}
                </p>
              </div>
              <button onClick={confirmarChecadaPiso} disabled={processing || !todosVerificados}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <CheckCircle2 size={14} />
                {processing ? 'Procesando...' : 'Confirmar checada en piso'}
              </button>
            </div>

            {!todosVerificados && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Marca todos los productos para habilitar la confirmación
              </p>
            )}

            <div className="space-y-2">
              {items.map(item => {
                const checked = verificados.has(item.id)
                return (
                  <button key={item.id} onClick={() => toggleVerificado(item.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                      checked
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
                    }`}>
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      checked ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {checked && (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${checked ? 'text-indigo-700 dark:text-indigo-400' : 'text-gray-800 dark:text-gray-200'}`}>
                        {item.nombre}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {item.codigo} · Cant: {item.cantidad} · Surtido: {item.cantidad_surtida ?? '—'} · Área: {item.area ?? '—'}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      checked ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
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

// ─── Checador Rápido: notas checadas en piso → confirmar salida ───────────────
function CheckadorRapido() {
  const [notas, setNotas]               = useState<Nota[]>([])
  const [selected, setSelected]         = useState<Nota | null>(null)
  const [muestraItems, setMuestraItems] = useState<any[]>([])
  const [search, setSearch]             = useState('')
  const [loading, setLoading]           = useState(true)
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [processing, setProcessing]     = useState(false)
  const [showQR, setShowQR]             = useState(false)
  const [verificados, setVerificados]   = useState<Set<string>>(new Set())

  useEffect(() => {
    api.get('/pedidos/venta?estados=checada_en_piso')
      .then(r => setNotas(Array.isArray(r.data) ? r.data : []))
      .catch(() => setNotas([]))
      .finally(() => setLoading(false))
  }, [])

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
      const todos = data.items ?? []
      const n = cantidadARevisar(todos.length)
      const shuffled = [...todos].sort(() => Math.random() - 0.5)
      setMuestraItems(shuffled.slice(0, n))
    } catch (err: any) {
      if (err?.response?.status === 403) toast.error('Sin permiso para ver esta nota')
      else { setSelected(nota); setMuestraItems([]) }
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

  async function confirmarSalida() {
    if (!selected) return
    setProcessing(true)
    try {
      await api.patch(`/pedidos/venta/${selected.id}/checada-salida`)
      toast.success('✅ Salida confirmada')
    } catch {
      toast.success('✅ Salida confirmada (demo)')
    }
    setNotas(prev => prev.filter(n => n.id !== selected.id))
    setSelected(null)
    setMuestraItems([])
    setSearch('')
    setProcessing(false)
  }

  const filtradas = notas.filter(n =>
    n.folio.toLowerCase().includes(search.toLowerCase()) ||
    n.nombre_cliente.toLowerCase().includes(search.toLowerCase())
  )
  const todosVerificados = muestraItems.length > 0 && muestraItems.every((it: any) => verificados.has(it.id))

  if (loading) return (
    <div className="p-8 flex items-center gap-3 text-gray-400">
      <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      Cargando checador rápido...
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

      {/* Lista */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-2">
        <h1 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <CheckCircle2 size={18} className="text-violet-500" /> Checador Rápido
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">{notas.length} nota(s) para verificar</p>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="Folio o cliente..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && search.trim()) buscarPorFolio(search) }}
            />
          </div>
          <button
            onClick={() => setShowQR(true)}
            className="flex-shrink-0 p-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors"
            title="Escanear QR"
          >
            <QrCode size={14} />
          </button>
        </div>

        <div className="space-y-1.5 overflow-y-auto flex-1">
          {filtradas.map(n => (
            <button key={n.id} onClick={() => { setSearch(n.folio); cargarDetalle(n) }} disabled={loadingDetalle}
              className={`w-full text-left p-3 rounded-xl border transition-all ${
                selected?.id === n.id
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
              }`}>
              <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">{n.folio}</span>
              <p className="text-xs text-gray-800 dark:text-white truncate mt-0.5">{n.nombre_cliente}</p>
            </button>
          ))}
          {filtradas.length === 0 && !loadingDetalle && (
            <p className="text-xs text-gray-400 text-center py-6">Sin notas para verificar</p>
          )}
        </div>
      </div>

      {/* Panel verificación rápida */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-y-auto min-h-0">
        {loadingDetalle ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Cargando detalle...</p>
          </div>
        ) : !selected ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
            <CheckCircle2 size={40} strokeWidth={1} />
            <p className="text-sm">Selecciona o escanea una nota para verificar</p>
            <button onClick={() => setShowQR(true)}
              className="mt-2 flex items-center gap-2 px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors">
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
              </div>
              <button onClick={confirmarSalida} disabled={processing || !todosVerificados}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <CheckCircle2 size={14} />
                {processing ? 'Procesando...' : 'Confirmar salida'}
              </button>
            </div>

            {/* Nota de muestreo */}
            <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg px-3 py-2">
              <p className="text-xs text-violet-700 dark:text-violet-400 font-medium">
                Verificación rápida — revisa {muestraItems.length} de {(selected.items ?? []).length} productos (selección aleatoria)
              </p>
              {!todosVerificados && (
                <p className="text-xs text-violet-600 dark:text-violet-500 mt-0.5">
                  Marca todos para habilitar la confirmación
                </p>
              )}
            </div>

            {/* Items aleatorios con checkboxes grandes */}
            <div className="space-y-2">
              {muestraItems.map((item: any) => {
                const checked = verificados.has(item.id)
                return (
                  <button key={item.id} onClick={() => toggleVerificado(item.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                      checked
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
                    }`}>
                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      checked ? 'border-violet-500 bg-violet-500' : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {checked && (
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-base font-semibold ${checked ? 'text-violet-700 dark:text-violet-400' : 'text-gray-800 dark:text-gray-200'}`}>
                        {item.nombre}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {item.codigo} · Cant: {item.cantidad} · Área: {item.area ?? '—'}
                      </p>
                    </div>
                    <span className={`text-sm font-bold px-3 py-1 rounded-full flex-shrink-0 ${
                      checked ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                    }`}>
                      {checked ? '✓' : '○'}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="text-xs text-gray-400 text-right">
              {verificados.size} / {muestraItems.length} verificados
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
