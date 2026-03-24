import { useEffect, useState } from 'react'
import { Search, Copy, CheckCircle2, CreditCard } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Nota, ESTADO_LABELS, MOCK_NOTAS } from './types'
import { QRCodeDisplay } from '../../components/pedidos/QRCodeDisplay'

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text).then(() => toast.success(`${label} copiado`)).catch(() => toast.error('No se pudo copiar'))
}

export default function VistaCajaPage() {
  const [notas, setNotas] = useState<Nota[]>([])
  const [selected, setSelected] = useState<Nota | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(false)

  useEffect(() => {
    api.get('/pedidos/venta?estados=lista_para_cobro')
      .then(r => setNotas(Array.isArray(r.data) ? r.data : []))
      .catch(() => setNotas(MOCK_NOTAS.filter(n => n.estado === 'lista_para_cobro')))
      .finally(() => setLoading(false))
  }, [])

  async function marcarCobrada() {
    if (!selected) return
    setMarking(true)
    try {
      await api.patch(`/pedidos/venta/${selected.id}/cobrar`)
      toast.success('Nota marcada como cobrada')
    } catch {
      toast.success('Marcada como cobrada (demo)')
    }
    setNotas(prev => prev.filter(n => n.id !== selected.id))
    setSelected(null)
    setMarking(false)
  }

  const notasFiltradas = notas.filter(n =>
    n.folio.toLowerCase().includes(search.toLowerCase()) ||
    n.nombre_cliente.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="p-8 flex items-center gap-3 text-gray-400">
      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      Cargando caja...
    </div>
  )

  return (
    <div className="p-4 md:p-6 flex gap-5 h-full min-h-0">
      {/* Panel izquierdo — lista + detalle nota */}
      <div className="w-80 flex-shrink-0 flex flex-col gap-3">
        <h1 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <CreditCard size={18} className="text-green-600" /> Vista de Caja
        </h1>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Folio o cliente..." value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="space-y-1.5 overflow-y-auto flex-1">
          {notasFiltradas.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-6">Sin notas para cobrar</p>
          )}
          {notasFiltradas.map(n => (
            <button key={n.id} onClick={() => setSelected(n)}
              className={`w-full text-left p-3 rounded-xl border transition-all ${
                selected?.id === n.id
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
              }`}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">{n.folio}</span>
                {n.facturacion && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Factura</span>}
              </div>
              <p className="text-xs text-gray-800 dark:text-white truncate">{n.nombre_cliente}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{n.items.length} productos · Agente: {n.vendedora?.numero_agente ?? '—'}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Panel derecho — detalle + CONTPAQi */}
      {!selected ? (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center space-y-2">
            <CreditCard size={40} strokeWidth={1} />
            <p>Selecciona una nota para procesar el cobro</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex gap-4 min-h-0">
          {/* Detalle nota */}
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 overflow-y-auto space-y-4">
            {/* Header + botones copiar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold font-mono text-gray-900 dark:text-white">{selected.folio}</h2>
                <button onClick={marcarCobrada} disabled={marking}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors">
                  <CheckCircle2 size={14} /> {marking ? 'Procesando...' : 'Marcar cobrada'}
                </button>
              </div>

              {/* Botones rápidos de copia */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Folio',      value: selected.folio },
                  { label: 'Cliente',    value: selected.nombre_cliente },
                  { label: 'Agente',     value: selected.vendedora?.numero_agente ?? '' },
                  { label: 'Obs.',       value: selected.notas ?? '' },
                ].map(({ label, value }) => (
                  <button key={label}
                    onClick={() => copyToClipboard(value, label)}
                    disabled={!value}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40 text-gray-700 dark:text-gray-300">
                    <Copy size={12} /> Copiar {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5">
                <p className="text-gray-400 mb-0.5">Vendedora · Agente</p>
                <p className="font-medium text-gray-900 dark:text-white">{selected.vendedora?.nombre}</p>
                <p className="text-gray-500">{selected.vendedora?.numero_agente ?? 'Sin agente'}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5">
                <p className="text-gray-400 mb-0.5">Opciones</p>
                {selected.facturacion && <p className="text-blue-600 font-medium">✓ Requiere factura</p>}
                {selected.descuento_especial && <p className="text-amber-600 font-medium">✓ Descuento especial</p>}
                {!selected.facturacion && !selected.descuento_especial && <p className="text-gray-400">Sin opciones especiales</p>}
              </div>
            </div>

            {selected.notas && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                Obs: {selected.notas}
              </div>
            )}

            {/* QR */}
            <div className="flex justify-center">
              <QRCodeDisplay folio={selected.folio} size={100} />
            </div>

            {/* Productos */}
            <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Código</th>
                    <th className="px-3 py-2 text-left">Descripción</th>
                    <th className="px-3 py-2 text-center w-16">Cant.</th>
                    <th className="px-3 py-2 text-center w-20">Copiar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {(selected.items ?? []).map(item => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-3 py-2 font-mono text-xs text-gray-600 dark:text-gray-400">{item.codigo}</td>
                      <td className="px-3 py-2 text-gray-800 dark:text-gray-200 text-sm">{item.nombre}</td>
                      <td className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300">{item.cantidad}</td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => copyToClipboard(item.codigo, `Código ${item.codigo}`)}
                          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Copiar código">
                          <Copy size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Panel CONTPAQi */}
          <div className="w-64 flex-shrink-0 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-4 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🖥</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">CONTPAQi</p>
              <p className="text-xs text-gray-400 mt-1">Usa los botones de copia para pegar los datos en el sistema de facturación</p>
            </div>
            <div className="text-xs text-gray-400 space-y-1 w-full bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 text-left">
              <p><span className="text-gray-500">Folio:</span> {selected.folio}</p>
              <p><span className="text-gray-500">Cliente:</span> {selected.nombre_cliente}</p>
              {selected.facturacion && <p className="text-blue-500 font-medium">Requiere factura</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
