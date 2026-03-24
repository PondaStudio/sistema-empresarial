import { useEffect, useState } from 'react'
import { Package, Save, Search } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Nota, ESTADO_LABELS, MOCK_NOTAS } from './types'

const ESTADOS_ITEM = ['pendiente', 'surtido', 'no_encontrado', 'surtido_parcial'] as const

export default function VistaSurtidoPage() {
  const [notas, setNotas] = useState<Nota[]>([])
  const [selected, setSelected] = useState<Nota | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [surtidoLocal, setSurtidoLocal] = useState<Record<string, { cantidad: number; estado: string }>>({})

  useEffect(() => {
    api.get('/pedidos/venta?estados=capturada,en_surtido,surtido_parcial,completa_en_piso')
      .then(r => setNotas(Array.isArray(r.data) ? r.data : []))
      .catch(() => setNotas(MOCK_NOTAS.filter(n => ['capturada', 'en_surtido', 'surtido_parcial'].includes(n.estado))))
      .finally(() => setLoading(false))
  }, [])

  function initSurtido(nota: Nota) {
    const init: Record<string, { cantidad: number; estado: string }> = {}
    nota.items.forEach(it => {
      init[it.id] = { cantidad: it.cantidad_surtida ?? 0, estado: it.estado_item }
    })
    setSurtidoLocal(init)
    setSelected(nota)
  }

  async function guardarSurtido() {
    if (!selected) return
    setSaving(true)
    const items = selected.items.map(it => ({
      id: it.id,
      cantidad_surtida: surtidoLocal[it.id]?.cantidad ?? 0,
      estado_item: surtidoLocal[it.id]?.estado ?? it.estado_item,
    }))

    const allSurtido = items.every(i => i.estado_item === 'surtido')
    const noneFound  = items.every(i => i.estado_item === 'no_encontrado')
    const nuevoEstado = allSurtido ? 'completa_en_piso' : noneFound ? 'con_incidencia' : 'surtido_parcial'

    try {
      await api.patch(`/pedidos/venta/${selected.id}/surtir`, { items, estado: nuevoEstado })
      toast.success('Surtido guardado')
    } catch {
      toast.success('Surtido guardado (demo)')
    }

    setNotas(prev => prev.map(n => n.id === selected.id
      ? { ...n, estado: nuevoEstado as any, items: n.items.map(it => ({
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
        <h1 className="text-base font-bold text-gray-900 dark:text-white">Cola de Surtido</h1>
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
              <button key={n.id} onClick={() => initSurtido(n)}
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

      {/* Surtido */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-y-auto min-h-0">
        {!selected ? (
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
                    const loc = surtidoLocal[item.id] ?? { cantidad: item.cantidad_surtida ?? 0, estado: item.estado_item }
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
                        <td className="px-3 py-2 text-center text-xs text-gray-500">{item.area ?? '—'}</td>
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
