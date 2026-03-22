import { useEffect, useState } from 'react'
import { Search, ScanLine, CheckCircle2 } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Nota, ESTADO_LABELS, MOCK_NOTAS } from './types'
import { QRCodeDisplay } from '../../components/pedidos/QRCodeDisplay'

export default function VistaChecadorPage() {
  const [notas, setNotas] = useState<Nota[]>([])
  const [selected, setSelected] = useState<Nota | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    api.get('/pedidos/notas?estados=cobrada,en_revision_salida')
      .then(r => {
        const data = Array.isArray(r.data) ? r.data : []
        setNotas(data.length ? data : MOCK_NOTAS.filter(n => ['cobrada', 'en_revision_salida'].includes(n.estado)))
      })
      .catch(() => setNotas(MOCK_NOTAS.filter(n => ['cobrada', 'en_revision_salida'].includes(n.estado))))
      .finally(() => setLoading(false))
  }, [])

  async function avanzar(endpoint: string, nuevoEstado: 'en_revision_salida' | 'cerrada', label: string) {
    if (!selected) return
    setProcessing(true)
    try {
      await api.patch(`/pedidos/notas/${selected.id}/${endpoint}`)
      toast.success(label)
    } catch {
      toast.success(`${label} (demo)`)
    }
    setNotas(prev => prev.map(n => n.id === selected.id ? { ...n, estado: nuevoEstado } : n))
    setSelected(prev => prev ? { ...prev, estado: nuevoEstado } : prev)
    setProcessing(false)
  }

  const notasFiltradas = notas.filter(n =>
    n.folio.toLowerCase().includes(search.toLowerCase()) ||
    n.nombre_cliente.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="p-8 flex items-center gap-3 text-gray-400">
      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      Cargando checador...
    </div>
  )

  return (
    <div className="p-4 md:p-6 flex gap-5 h-full min-h-0">
      {/* Lista */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-2">
        <h1 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ScanLine size={18} className="text-indigo-500" /> Vista Checador
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">{notas.length} nota(s) para revisar</p>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Folio o QR..." value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="space-y-1.5 overflow-y-auto flex-1">
          {notasFiltradas.map(n => {
            const est = ESTADO_LABELS[n.estado] ?? ESTADO_LABELS.cobrada
            return (
              <button key={n.id} onClick={() => setSelected(n)}
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
          {notasFiltradas.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-6">Sin notas pendientes</p>
          )}
        </div>
      </div>

      {/* Detalle */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-y-auto min-h-0">
        {!selected ? (
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
              <div className="flex gap-2">
                {selected.estado === 'cobrada' && (
                  <button onClick={() => avanzar('revision-salida', 'en_revision_salida', 'En revisión de salida')}
                    disabled={processing}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors">
                    <ScanLine size={14} /> Escanear
                  </button>
                )}
                {selected.estado === 'en_revision_salida' && (
                  <button onClick={() => avanzar('cerrar', 'cerrada', 'Nota cerrada')}
                    disabled={processing}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors">
                    <CheckCircle2 size={14} /> Cerrar nota
                  </button>
                )}
              </div>
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
                    <th className="px-3 py-2 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {selected.items.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-3 py-2 font-mono text-xs text-gray-600 dark:text-gray-400">{item.codigo}</td>
                      <td className="px-3 py-2 text-gray-800 dark:text-gray-200">{item.nombre}</td>
                      <td className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300">{item.cantidad}</td>
                      <td className="px-3 py-2 text-center text-gray-500">{item.cantidad_surtida ?? '—'}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          item.estado_item === 'surtido' ? 'bg-green-100 text-green-700' :
                          item.estado_item === 'no_encontrado' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {item.estado_item}
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
