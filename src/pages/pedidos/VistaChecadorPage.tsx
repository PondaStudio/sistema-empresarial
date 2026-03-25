import { useEffect, useState } from 'react'
import { Search, ScanLine, CheckCircle2 } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { Nota, ESTADO_LABELS, MOCK_NOTAS } from './types'
import { QRCodeDisplay } from '../../components/pedidos/QRCodeDisplay'

export default function VistaChecadorPage() {
  const subtipo = useAuthStore(s => s.user?.subtipo ?? 'checador_escaner')

  if (subtipo === 'checador_rapido') return <CheckadorRapido />
  return <CheckadorEscaner />
}

// ─── Checador Escáner: ve notas cobradas, confirma checada en piso ────────────
function CheckadorEscaner() {
  const [notas, setNotas] = useState<Nota[]>([])
  const [selected, setSelected] = useState<Nota | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    api.get('/pedidos/venta?estados=cobrada')
      .then(r => setNotas(Array.isArray(r.data) ? r.data : []))
      .catch(() => setNotas(MOCK_NOTAS.filter(n => n.estado === 'cobrada')))
      .finally(() => setLoading(false))
  }, [])

  async function seleccionarNota(nota: Nota) {
    setLoadingDetalle(true)
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

  async function confirmarChecadaPiso() {
    if (!selected) return
    setProcessing(true)
    try {
      await api.patch(`/pedidos/venta/${selected.id}/checada-piso`)
      toast.success('Checada en piso confirmada')
    } catch {
      toast.success('Checada en piso (demo)')
    }
    setNotas(prev => prev.filter(n => n.id !== selected.id))
    setSelected(null)
    setProcessing(false)
  }

  const filtradas = notas.filter(n =>
    n.folio.toLowerCase().includes(search.toLowerCase()) ||
    n.nombre_cliente.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="p-8 flex items-center gap-3 text-gray-400">
      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      Cargando checador escáner...
    </div>
  )

  return (
    <div className="p-4 md:p-6 flex gap-5 h-full min-h-0">
      {/* Lista */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-2">
        <h1 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ScanLine size={18} className="text-indigo-500" /> Checador Escáner
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">{notas.length} nota(s) cobradas</p>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Folio o QR..." value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="space-y-1.5 overflow-y-auto flex-1">
          {filtradas.map(n => {
            const est = ESTADO_LABELS[n.estado] ?? ESTADO_LABELS.cobrada
            return (
              <button key={n.id} onClick={() => seleccionarNota(n)} disabled={loadingDetalle}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  selected?.id === n.id
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
                }`}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">{n.folio}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${est.color}`}>{est.label}</span>
                </div>
                <p className="text-xs text-gray-800 dark:text-white truncate">{n.nombre_cliente}</p>
              </button>
            )
          })}
          {filtradas.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-6">Sin notas cobradas</p>
          )}
        </div>
      </div>

      {/* Detalle */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-y-auto min-h-0">
        {loadingDetalle ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Cargando detalle...</p>
          </div>
        ) : !selected ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
            <ScanLine size={40} strokeWidth={1} />
            <p>Selecciona o escanea una nota para revisar</p>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-lg font-bold font-mono text-gray-900 dark:text-white">{selected.folio}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selected.nombre_cliente}</p>
                <p className="text-xs text-gray-400 mt-0.5">Agente: {selected.vendedora?.numero_agente ?? '—'} · {selected.vendedora?.nombre}</p>
              </div>
              <button onClick={confirmarChecadaPiso} disabled={processing}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors">
                <CheckCircle2 size={14} /> {processing ? 'Procesando...' : 'Confirmar checada en piso'}
              </button>
            </div>

            {selected.qr_code && (
              <div className="flex justify-center">
                <QRCodeDisplay folio={selected.folio} size={120} />
              </div>
            )}

            <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Código</th>
                    <th className="px-3 py-2 text-left">Descripción</th>
                    <th className="px-3 py-2 text-center">Cant.</th>
                    <th className="px-3 py-2 text-center">Surtido</th>
                    <th className="px-3 py-2 text-center">Área</th>
                    <th className="px-3 py-2 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {(selected.items ?? []).map(item => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-3 py-2 font-mono text-xs text-gray-600 dark:text-gray-400">{item.codigo}</td>
                      <td className="px-3 py-2 text-gray-800 dark:text-gray-200">{item.nombre}</td>
                      <td className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300">{item.cantidad}</td>
                      <td className="px-3 py-2 text-center text-gray-500">{item.cantidad_surtida ?? '—'}</td>
                      <td className="px-3 py-2 text-center text-xs text-gray-500">{item.area ?? '—'}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          item.estado_item === 'surtido'        ? 'bg-green-100 text-green-700' :
                          item.estado_item === 'no_disponible'  ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {item.estado_item ?? 'pendiente'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Checador Rápido: ve notas checadas en piso, verifica 3 al azar ──────────
function CheckadorRapido() {
  const [notas, setNotas] = useState<Nota[]>([])
  const [selected, setSelected] = useState<Nota | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [muestraItems, setMuestraItems] = useState<typeof selected extends null ? never[] : any[]>([])

  useEffect(() => {
    api.get('/pedidos/venta?estados=checada_en_piso')
      .then(r => setNotas(Array.isArray(r.data) ? r.data : []))
      .catch(() => setNotas([]))
      .finally(() => setLoading(false))
  }, [])

  async function seleccionarNota(nota: Nota) {
    setLoadingDetalle(true)
    try {
      const { data } = await api.get(`/pedidos/venta/${nota.id}`)
      setSelected(data)
      // Elegir 3 items aleatorios para verificación rápida
      const todos = data.items ?? []
      const shuffled = [...todos].sort(() => Math.random() - 0.5)
      setMuestraItems(shuffled.slice(0, Math.min(3, shuffled.length)))
    } catch (err: any) {
      if (err?.response?.status === 403) {
        toast.error('Sin permiso para ver esta nota')
      } else {
        setSelected(nota)
        setMuestraItems([])
      }
    } finally {
      setLoadingDetalle(false)
    }
  }

  async function confirmarSalida() {
    if (!selected) return
    setProcessing(true)
    try {
      await api.patch(`/pedidos/venta/${selected.id}/checada-salida`)
      toast.success('Salida confirmada')
    } catch {
      toast.success('Salida confirmada (demo)')
    }
    setNotas(prev => prev.filter(n => n.id !== selected.id))
    setSelected(null)
    setMuestraItems([])
    setProcessing(false)
  }

  const filtradas = notas.filter(n =>
    n.folio.toLowerCase().includes(search.toLowerCase()) ||
    n.nombre_cliente.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="p-8 flex items-center gap-3 text-gray-400">
      <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      Cargando checador rápido...
    </div>
  )

  return (
    <div className="p-4 md:p-6 flex gap-5 h-full min-h-0">
      {/* Lista */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-2">
        <h1 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <CheckCircle2 size={18} className="text-violet-500" /> Checador Rápido
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">{notas.length} nota(s) en espera</p>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            placeholder="Folio o cliente..." value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="space-y-1.5 overflow-y-auto flex-1">
          {filtradas.map(n => (
            <button key={n.id} onClick={() => seleccionarNota(n)} disabled={loadingDetalle}
              className={`w-full text-left p-3 rounded-xl border transition-all ${
                selected?.id === n.id
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
              }`}>
              <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">{n.folio}</span>
              <p className="text-xs text-gray-800 dark:text-white truncate mt-0.5">{n.nombre_cliente}</p>
            </button>
          ))}
          {filtradas.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-6">Sin notas para verificar</p>
          )}
        </div>
      </div>

      {/* Detalle */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-y-auto min-h-0">
        {loadingDetalle ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Cargando detalle...</p>
          </div>
        ) : !selected ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
            <CheckCircle2 size={40} strokeWidth={1} />
            <p>Selecciona una nota para verificación rápida</p>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-lg font-bold font-mono text-gray-900 dark:text-white">{selected.folio}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selected.nombre_cliente}</p>
              </div>
              <button onClick={confirmarSalida} disabled={processing}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-60 transition-colors">
                <CheckCircle2 size={14} /> {processing ? 'Procesando...' : 'Confirmar salida'}
              </button>
            </div>

            <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg px-3 py-2 text-xs text-violet-700 dark:text-violet-400">
              Verificación rápida — revisa estos {muestraItems.length} productos al azar de {(selected.items ?? []).length} totales
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Código</th>
                    <th className="px-3 py-2 text-left">Descripción</th>
                    <th className="px-3 py-2 text-center">Cant.</th>
                    <th className="px-3 py-2 text-center">Área</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {muestraItems.map((item: any) => (
                    <tr key={item.id} className="hover:bg-violet-50 dark:hover:bg-violet-900/10">
                      <td className="px-3 py-2 font-mono text-xs text-gray-600 dark:text-gray-400">{item.codigo}</td>
                      <td className="px-3 py-2 text-gray-800 dark:text-gray-200">{item.nombre}</td>
                      <td className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300">{item.cantidad}</td>
                      <td className="px-3 py-2 text-center text-xs text-gray-500">{item.area ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
