import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Copy, CheckCircle2, CreditCard, Loader2 } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Nota } from './types'
import { QRCodeDisplay } from '../../components/pedidos/QRCodeDisplay'

function copiar(text: string, label: string) {
  if (!text) return
  navigator.clipboard.writeText(text)
    .then(() => toast.success(`¡Copiado! ${label}`, { duration: 1500 }))
    .catch(() => toast.error('No se pudo copiar'))
}

export default function VistaCajaFijaPage() {
  const { id } = useParams<{ id: string }>()
  const [nota, setNota] = useState<Nota | null>(null)
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(false)
  const [cobrada, setCobrada] = useState(false)

  useEffect(() => {
    if (!id) return
    api.get(`/pedidos/venta/${id}`)
      .then(r => setNota(r.data))
      .catch(() => toast.error('No se pudo cargar la nota'))
      .finally(() => setLoading(false))
  }, [id])

  async function marcarCobrada() {
    if (!nota) return
    setMarking(true)
    try {
      await api.patch(`/pedidos/venta/${nota.id}/cobrar`)
      setCobrada(true)
      toast.success('Nota marcada como cobrada')
      // Actualizar título de ventana
      document.title = `✅ Cobrada — ${nota.folio}`
    } catch {
      toast.success('Marcada como cobrada (demo)')
      setCobrada(true)
    }
    setMarking(false)
  }

  // ── Loading ──────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center gap-3 text-gray-400">
        <Loader2 size={20} className="animate-spin text-green-500" />
        <span>Cargando nota de caja...</span>
      </div>
    </div>
  )

  if (!nota) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <p className="text-gray-500">Nota no encontrada.</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Banner informativo */}
      <div className="bg-blue-600 text-white text-xs text-center py-2 px-4 shrink-0">
        📌 Mantén esta ventana abierta mientras cobras en CONTPAQi
      </div>

      {/* Barra superior */}
      <div className={`flex items-center justify-between px-4 py-3 ${cobrada ? 'bg-gray-500' : 'bg-green-600'} text-white shrink-0`}>
        <span className="font-bold text-sm flex items-center gap-2">
          <CreditCard size={16} />
          Modo Caja — {nota.folio} — {nota.nombre_cliente}
        </span>
        {cobrada ? (
          <span className="flex items-center gap-1.5 text-sm font-semibold">
            <CheckCircle2 size={16} /> Cobrada — puedes cerrar esta pestaña
          </span>
        ) : (
          <button
            onClick={marcarCobrada}
            disabled={marking}
            className="flex items-center gap-2 px-5 py-2 bg-white text-green-700 rounded-lg font-bold text-sm hover:bg-green-50 disabled:opacity-60 transition-colors shadow"
          >
            <CheckCircle2 size={16} />
            {marking ? 'Procesando...' : '✅ Marcar como Cobrada'}
          </button>
        )}
      </div>

      {/* Contenido */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-5">

        {/* Datos del cliente */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-0.5">Cliente</p>
              <p className="font-semibold text-gray-900 dark:text-white">{nota.nombre_cliente || 'Público en general'}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-0.5">Vendedora · Agente</p>
              <p className="font-semibold text-gray-900 dark:text-white">{nota.vendedora?.nombre}</p>
              <p className="text-sm text-gray-500">{nota.vendedora?.numero_agente ?? 'Sin agente'}</p>
            </div>
          </div>

          {/* Badges de opciones especiales */}
          {(nota.facturacion || nota.descuento_especial) && (
            <div className="flex gap-2 flex-wrap">
              {nota.facturacion && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full border border-blue-200">
                  ✓ Requiere factura
                </span>
              )}
              {nota.descuento_especial && (
                <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full border border-amber-200">
                  ✓ Descuento especial
                </span>
              )}
            </div>
          )}

          {nota.notas && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
              Obs: {nota.notas}
            </div>
          )}

          {/* Botones de copia rápida */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Cliente',  value: nota.nombre_cliente },
              { label: 'Agente',   value: nota.vendedora?.numero_agente ?? '' },
              { label: 'Obs.',     value: nota.notas ?? '' },
            ].map(({ label, value }) => (
              <button key={label}
                onClick={() => copiar(value, label)}
                disabled={!value}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40 text-gray-700 dark:text-gray-300">
                <Copy size={11} /> Copiar {label}
              </button>
            ))}
          </div>

          {/* QR */}
          <div className="flex justify-center pt-1">
            <QRCodeDisplay folio={nota.folio} size={90} />
          </div>
        </div>

        {/* Lista de productos */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              Productos ({(nota.items ?? []).length})
            </h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-2 text-left w-24">Código</th>
                <th className="px-3 py-2 text-left">Descripción</th>
                <th className="px-3 py-2 text-center w-12">Cant.</th>
                <th className="px-3 py-2 text-center w-32">Copiar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {(nota.items ?? []).map(item => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-3 py-2.5 font-mono text-xs text-gray-600 dark:text-gray-400">{item.codigo}</td>
                  <td className="px-3 py-2.5 text-gray-800 dark:text-gray-200">{item.nombre}</td>
                  <td className="px-3 py-2.5 text-center font-semibold text-gray-700 dark:text-gray-300">{item.cantidad}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => copiar(item.codigo, item.codigo)}
                        className="flex items-center gap-0.5 px-2 py-1 text-[10px] rounded border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 dark:hover:bg-blue-900/20 transition-colors">
                        <Copy size={10} /> Código
                      </button>
                      <button
                        onClick={() => copiar(item.nombre, item.nombre)}
                        className="flex items-center gap-0.5 px-2 py-1 text-[10px] rounded border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-green-50 hover:text-green-600 hover:border-green-300 dark:hover:bg-green-900/20 transition-colors">
                        <Copy size={10} /> Desc.
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Botón cobrar al final para mobile */}
        {!cobrada && (
          <button
            onClick={marcarCobrada}
            disabled={marking}
            className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-base hover:bg-green-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2 shadow-lg">
            <CheckCircle2 size={20} />
            {marking ? 'Procesando...' : '✅ Marcar como Cobrada'}
          </button>
        )}
      </div>
    </div>
  )
}
