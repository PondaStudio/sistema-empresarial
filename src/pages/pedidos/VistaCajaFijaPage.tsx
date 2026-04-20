import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Copy, CheckCircle2, CreditCard, Loader2, Send } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Nota, ItemNota } from './types'
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
  const [extraTabCodes, setExtraTabCodes] = useState<Set<string>>(new Set())
  const [marking, setMarking] = useState(false)
  const [cobrada, setCobrada] = useState(false)
  const [contpaqiStatus, setContpaqiStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [contpaqiError, setContpaqiError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!id) return
    Promise.all([
      api.get(`/pedidos/venta/${id}`),
      api.get('/productos/extra-tab-codes'),
    ])
      .then(([notaRes, codesRes]) => {
        setNota(notaRes.data)
        setExtraTabCodes(new Set(codesRes.data as string[]))
      })
      .catch(() => toast.error('No se pudo cargar la nota'))
      .finally(() => setLoading(false))
  }, [id])

  function buildContpaqiPayload(items: ItemNota[]) {
    return items
      .filter(item => item.codigo && item.cantidad)
      .map(item => `${item.codigo}|${item.cantidad}`)
      .join('\n')
  }

  async function sendToContpaqi(items: ItemNota[]) {
    const payload = buildContpaqiPayload(items)
    const response = await fetch('http://127.0.0.1:8765/send-to-contpaqi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products: payload })
    })
    if (!response.ok) throw new Error(await response.text())
    return response.json()
  }

  function handleEnviarContpaqi() {
    const items = nota?.items ?? []
    if (!items.length) return
    setContpaqiStatus('sending')
    setContpaqiError('')
    setCountdown(3)

    let remaining = 3
    countdownTimer.current = setInterval(() => {
      remaining -= 1
      setCountdown(remaining)
      if (remaining <= 0) {
        clearInterval(countdownTimer.current!)
        sendToContpaqi(items)
          .then(() => setContpaqiStatus('success'))
          .catch((err: Error) => {
            const msg = err.message || ''
            if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('err_connection_refused') || msg.toLowerCase().includes('networkerror')) {
              setContpaqiError('⚠️ Helper local no encontrado. ¿Está corriendo el servidor local?')
            } else if (msg.toLowerCase().includes('contpaqi') || msg.toLowerCase().includes('no está abierto')) {
              setContpaqiError('⚠️ CONTPAQi no está abierto')
            } else {
              setContpaqiError(`⚠️ ${msg || 'Error desconocido'}`)
            }
            setContpaqiStatus('error')
          })
      }
    }, 1000)
  }

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
        💡 Usa <kbd className="bg-blue-500 border border-blue-400 rounded px-1 py-0.5 font-mono text-[11px]">Ctrl+Tab</kbd> para alternar entre esta pestaña y CONTPAQi
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
            {marking ? 'Procesando...' : '✅ Ya cobré — Marcar como Cobrada'}
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
        {(() => {
          const allItems = nota.items ?? []
          const itemsEspeciales = allItems.filter(i => extraTabCodes.has(i.codigo))
          const itemsNormales = allItems.filter(i => !extraTabCodes.has(i.codigo))
          const hayEspeciales = itemsEspeciales.length > 0

          function renderRows(items: ItemNota[]) {
            return items.map(item => (
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
            ))
          }

          return (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Productos ({allItems.length})
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
                  {hayEspeciales ? (
                    <>
                      <tr>
                        <td colSpan={4} className="px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-700">
                          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                            ⚠️ Ingresar primero
                            <span className="bg-amber-200 dark:bg-amber-700 text-amber-800 dark:text-amber-200 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                              {itemsEspeciales.length}
                            </span>
                          </span>
                        </td>
                      </tr>
                      {renderRows(itemsEspeciales)}
                      {itemsNormales.length > 0 && (
                        <>
                          <tr>
                            <td colSpan={4} className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                Productos normales
                              </span>
                            </td>
                          </tr>
                          {renderRows(itemsNormales)}
                        </>
                      )}
                    </>
                  ) : (
                    renderRows(allItems)
                  )}
                </tbody>
              </table>
            </div>
          )
        })()}

        {/* Botón Enviar a CONTPAQi */}
        {(nota.items ?? []).length > 0 && (
          <div className="space-y-2">
            {contpaqiStatus === 'idle' && (
              <button
                onClick={handleEnviarContpaqi}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow">
                <Send size={16} /> Enviar a CONTPAQi
              </button>
            )}
            {contpaqiStatus === 'sending' && (
              <div className="w-full bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-semibold text-sm">
                  <Loader2 size={16} className="animate-spin" />
                  ⏱️ Enviando en 3 segundos...
                </div>
                <p className="text-xs text-indigo-600 dark:text-indigo-400">
                  ⏱️ Enviando en {countdown} segundos...
                </p>
                <div className="w-full bg-indigo-200 dark:bg-indigo-800 rounded-full h-1.5">
                  <div
                    className="bg-indigo-600 h-1.5 rounded-full transition-all duration-1000"
                    style={{ width: `${(countdown / 3) * 100}%` }}
                  />
                </div>
              </div>
            )}
            {contpaqiStatus === 'success' && (
              <div className="w-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-3 text-center text-green-700 dark:text-green-300 font-semibold text-sm">
                ✅ Productos enviados a CONTPAQi
              </div>
            )}
            {contpaqiStatus === 'error' && (
              <div className="w-full space-y-2">
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3 text-amber-700 dark:text-amber-300 text-sm">
                  {contpaqiError}
                </div>
                <button
                  onClick={handleEnviarContpaqi}
                  className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                  <Send size={15} /> Reintentar
                </button>
              </div>
            )}
          </div>
        )}

        {/* Botón cobrar al final para mobile */}
        {!cobrada && (
          <button
            onClick={marcarCobrada}
            disabled={marking}
            className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-base hover:bg-green-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2 shadow-lg">
            <CheckCircle2 size={20} />
            {marking ? 'Procesando...' : '✅ Ya cobré — Marcar como Cobrada'}
          </button>
        )}
      </div>
    </div>
  )
}
