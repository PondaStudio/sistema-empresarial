import { useEffect, useState } from 'react'
import { Search, Copy, CheckCircle2, CreditCard, ExternalLink } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Nota, MOCK_NOTAS } from './types'
import { QRCodeDisplay } from '../../components/pedidos/QRCodeDisplay'

function copiar(text: string, label: string) {
  if (!text) return
  navigator.clipboard.writeText(text)
    .then(() => toast.success(`¡Copiado! ${label}`, { duration: 1500 }))
    .catch(() => toast.error('No se pudo copiar'))
}

export default function VistaCajaPage() {
  const [notas, setNotas] = useState<Nota[]>([])
  const [selected, setSelected] = useState<Nota | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [marking, setMarking] = useState(false)
  const [mobileShowDetail, setMobileShowDetail] = useState(false)

  useEffect(() => {
    api.get('/pedidos/venta?estados=lista_para_cobro')
      .then(r => setNotas(Array.isArray(r.data) ? r.data : []))
      .catch(() => setNotas(MOCK_NOTAS.filter(n => n.estado === 'lista_para_cobro')))
      .finally(() => setLoading(false))
  }, [])

  async function seleccionarNota(nota: Nota) {
    setLoadingDetalle(true)
    try {
      const { data } = await api.get(`/pedidos/venta/${nota.id}`)
      setSelected(data)
      setMobileShowDetail(true)
    } catch (err: any) {
      if (err?.response?.status === 403) {
        toast.error('Sin permiso para ver esta nota')
      } else {
        setSelected(nota)
        setMobileShowDetail(true)
      }
    } finally {
      setLoadingDetalle(false)
    }
  }

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
    setMobileShowDetail(false)
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

  const PanelDetalle = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 overflow-y-auto space-y-4 h-full">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Cliente</p>
            <p className="font-semibold text-gray-900 dark:text-white">{selected!.nombre_cliente}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => window.open(`/pedidos/caja-fija/${selected!.id}`, '_blank')}
              title="Abrir en nueva pestaña modo caja"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <ExternalLink size={12} /> Modo Caja
            </button>
            <button onClick={marcarCobrada} disabled={marking}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors">
              <CheckCircle2 size={14} /> {marking ? 'Procesando...' : 'Marcar cobrada'}
            </button>
          </div>
        </div>

        {/* Botones rápidos de copia — sin folio */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Cliente',  value: selected!.nombre_cliente },
            { label: 'Agente',   value: selected!.vendedora?.numero_agente ?? '' },
            { label: 'Obs.',     value: selected!.notas ?? '' },
          ].map(({ label, value }) => (
            <button key={label}
              onClick={() => copiar(value, label)}
              disabled={!value}
              className="flex items-center gap-1.5 px-3 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40 text-gray-700 dark:text-gray-300">
              <Copy size={11} /> Copiar {label}
            </button>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5">
          <p className="text-gray-400 mb-0.5">Vendedora · Agente</p>
          <p className="font-medium text-gray-900 dark:text-white">{selected!.vendedora?.nombre}</p>
          <p className="text-gray-500">{selected!.vendedora?.numero_agente ?? 'Sin agente'}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5">
          <p className="text-gray-400 mb-0.5">Opciones</p>
          {selected!.facturacion && <p className="text-blue-600 font-medium">✓ Requiere factura</p>}
          {selected!.descuento_especial && <p className="text-amber-600 font-medium">✓ Descuento especial</p>}
          {!selected!.facturacion && !selected!.descuento_especial && <p className="text-gray-400">Sin opciones especiales</p>}
        </div>
      </div>

      {selected!.notas && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          Obs: {selected!.notas}
        </div>
      )}

      {/* QR */}
      <div className="flex justify-center">
        <QRCodeDisplay folio={selected!.folio} size={90} />
      </div>

      {/* Productos con doble botón de copia */}
      <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2 text-left w-24">Código</th>
              <th className="px-3 py-2 text-left">Descripción</th>
              <th className="px-3 py-2 text-center w-14">Cant.</th>
              <th className="px-3 py-2 text-center w-32">Copiar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {(selected!.items ?? []).map(item => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td className="px-3 py-2 font-mono text-xs text-gray-600 dark:text-gray-400">{item.codigo}</td>
                <td className="px-3 py-2 text-gray-800 dark:text-gray-200 text-sm">{item.nombre}</td>
                <td className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300">{item.cantidad}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => copiar(item.codigo, item.codigo)}
                      title="Copiar código"
                      className="flex items-center gap-0.5 px-1.5 py-1 text-[10px] rounded border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 dark:hover:bg-blue-900/20 transition-colors">
                      <Copy size={10} /> Código
                    </button>
                    <button
                      onClick={() => copiar(item.nombre, item.nombre)}
                      title="Copiar descripción"
                      className="flex items-center gap-0.5 px-1.5 py-1 text-[10px] rounded border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-green-50 hover:text-green-600 hover:border-green-300 dark:hover:bg-green-900/20 transition-colors">
                      <Copy size={10} /> Desc.
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <div className="p-4 md:p-6 flex flex-col md:flex-row gap-5 h-full min-h-0">
      {/* Lista de notas */}
      <div className={`${mobileShowDetail ? 'hidden' : 'flex'} md:flex flex-col w-full md:w-72 md:flex-shrink-0 gap-2`}>
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
            <button key={n.id} onClick={() => seleccionarNota(n)} disabled={loadingDetalle}
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
              <p className="text-[10px] text-gray-400 mt-0.5">{(n.items ?? []).length} prod. · Agente: {n.vendedora?.numero_agente ?? '—'}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Panel derecho */}
      <div className={`${mobileShowDetail ? 'flex' : 'hidden'} md:flex flex-col flex-1 min-h-0`}>
        <button
          onClick={() => setMobileShowDetail(false)}
          className="md:hidden flex items-center gap-1 text-sm text-blue-600 mb-3 min-h-[44px]">
          ← Volver
        </button>
        {loadingDetalle ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
            <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Cargando detalle...</p>
          </div>
        ) : !selected ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center space-y-2">
              <CreditCard size={40} strokeWidth={1} />
              <p>Selecciona una nota para procesar el cobro</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0">
            <PanelDetalle />
          </div>
        )}
      </div>

    </div>
  )
}
