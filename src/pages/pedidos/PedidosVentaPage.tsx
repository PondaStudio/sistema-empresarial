import { useEffect, useState } from 'react'
import { Plus, Printer, Package, CheckCircle, Eye, X, ChevronDown } from 'lucide-react'
import api from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface ItemPedido {
  id: string
  producto_id: string
  cantidad: number
  estado_confirmacion: 'pendiente' | 'confirmado' | 'sin_stock' | 'sustituto'
  sustituto_producto_id?: string | null
  observaciones?: string
  confirmado_at?: string | null
  productos?: { nombre: string; codigo: string }
  sustituto?: { nombre: string } | null
}

interface PedidoDetalle {
  id: string
  folio: string
  estado: EstadoPedido
  nombre_cliente?: string
  notas?: string
  created_at: string
  vendedora?: { nombre: string }
  sucursales?: { nombre: string }
  items_pedido_venta?: ItemPedido[]
}

type EstadoPedido =
  | 'borrador'
  | 'pendiente_confirmacion'
  | 'confirmado'
  | 'impreso'
  | 'surtido'
  | 'verificado'
  | 'cerrado'
  | 'cancelado'

interface ItemNuevo {
  producto_id: string
  nombre: string
  cantidad: number
}

// ─── Constantes ──────────────────────────────────────────────────────────────

const ESTADO_LABELS: Record<EstadoPedido | string, { label: string; color: string }> = {
  borrador:               { label: 'Borrador',             color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
  pendiente_confirmacion: { label: 'Pend. confirmación',   color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400' },
  confirmado:             { label: 'Confirmado',           color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400' },
  impreso:                { label: 'Impreso',              color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400' },
  surtido:                { label: 'Surtido',              color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400' },
  verificado:             { label: 'Verificado',           color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400' },
  cerrado:                { label: 'Cerrado ✓',            color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' },
  cancelado:              { label: 'Cancelado',            color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' },
}

const ITEM_ESTADO_LABELS: Record<string, { label: string; color: string }> = {
  pendiente:  { label: 'Pendiente',  color: 'bg-yellow-100 text-yellow-700' },
  confirmado: { label: 'Confirmado', color: 'bg-green-100 text-green-700' },
  sin_stock:  { label: 'Sin stock',  color: 'bg-red-100 text-red-700' },
  sustituto:  { label: 'Sustituto',  color: 'bg-blue-100 text-blue-700' },
}

// Mock data para cuando el API no responde
const MOCK_PEDIDOS: PedidoDetalle[] = [
  {
    id: 'mock-1',
    folio: 'PV-2026-0042',
    estado: 'pendiente_confirmacion',
    nombre_cliente: 'Refaccionaria El Pistón',
    created_at: new Date().toISOString(),
    vendedora: { nombre: 'Ana García' },
    sucursales: { nombre: 'Norte' },
    items_pedido_venta: [
      { id: 'i1', producto_id: 'p1', cantidad: 5, estado_confirmacion: 'confirmado', productos: { nombre: 'Aceite Motor 5W-30', codigo: 'ACT-001' } },
      { id: 'i2', producto_id: 'p2', cantidad: 2, estado_confirmacion: 'pendiente',  productos: { nombre: 'Filtro de Aceite',   codigo: 'FLT-003' } },
      { id: 'i3', producto_id: 'p3', cantidad: 4, estado_confirmacion: 'sin_stock',  productos: { nombre: 'Bujías NGK',         codigo: 'BJA-010' } },
    ],
  },
  {
    id: 'mock-2',
    folio: 'PV-2026-0041',
    estado: 'confirmado',
    nombre_cliente: 'Auto Parts Norte SA',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    vendedora: { nombre: 'María López' },
    sucursales: { nombre: 'Norte' },
    items_pedido_venta: [
      { id: 'i4', producto_id: 'p4', cantidad: 1, estado_confirmacion: 'confirmado', productos: { nombre: 'Pastillas de Freno Bosch', codigo: 'FRN-007' } },
      { id: 'i5', producto_id: 'p5', cantidad: 3, estado_confirmacion: 'confirmado', productos: { nombre: 'Líquido de Frenos DOT4',   codigo: 'LQD-002' } },
    ],
  },
  {
    id: 'mock-3',
    folio: 'PV-2026-0040',
    estado: 'cerrado',
    nombre_cliente: 'Taller Mecánico Ramos',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    vendedora: { nombre: 'Ana García' },
    sucursales: { nombre: 'Norte' },
    items_pedido_venta: [
      { id: 'i6', producto_id: 'p6', cantidad: 2, estado_confirmacion: 'confirmado', productos: { nombre: 'Correa Distribución', codigo: 'CRR-015' } },
    ],
  },
]

// ─── Componente principal ────────────────────────────────────────────────────

export default function PedidosVentaPage() {
  const { can, user } = useAuthStore()
  const nivel = user?.roles?.nivel ?? 99
  const [pedidos, setPedidos] = useState<PedidoDetalle[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<PedidoDetalle | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [showNuevo, setShowNuevo] = useState(false)
  const [isMockMode, setIsMockMode] = useState(false)

  // Almacenistas (nivel 9) ven pedidos de su sucursal, no solo los propios
  const isAlmacenista = nivel === 9

  // ── Carga inicial ──
  useEffect(() => {
    api.get('/pedidos/venta')
      .then(r => {
        setPedidos(Array.isArray(r.data) ? r.data : MOCK_PEDIDOS)
      })
      .catch(() => {
        // Mock fallback: almacenistas ven pedidos pendientes de confirmación
        const mockFallback = isAlmacenista
          ? MOCK_PEDIDOS.filter(p => ['pendiente_confirmacion', 'en_revision', 'confirmado', 'impreso'].includes(p.estado))
          : MOCK_PEDIDOS
        setPedidos(mockFallback)
        setIsMockMode(true)
      })
      .finally(() => setLoading(false))
  }, [])

  // ── Cargar detalle ──
  async function loadDetail(id: string) {
    if (isMockMode) {
      setSelected(MOCK_PEDIDOS.find(p => p.id === id) ?? null)
      return
    }
    setDetailLoading(true)
    try {
      const { data } = await api.get(`/pedidos/venta/${id}`)
      setSelected(data)
    } catch {
      const mock = MOCK_PEDIDOS.find(p => p.id === id)
      if (mock) setSelected(mock)
    } finally {
      setDetailLoading(false)
    }
  }

  // ── Confirmar item (almacenista) ──
  async function confirmarItem(pedidoId: string, itemId: string, estado: 'confirmado' | 'sin_stock' | 'sustituto') {
    if (isMockMode) {
      setSelected(prev => {
        if (!prev) return prev
        return {
          ...prev,
          items_pedido_venta: prev.items_pedido_venta?.map(i =>
            i.id === itemId ? { ...i, estado_confirmacion: estado } : i
          ),
        }
      })
      toast.success('Item actualizado (modo demo)')
      return
    }
    try {
      await api.patch(`/pedidos/venta/${pedidoId}/items/${itemId}`, { estado_confirmacion: estado })
      toast.success('Item actualizado')
      await loadDetail(pedidoId)
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Error al confirmar item')
    }
  }

  // ── Avanzar estado del pedido ──
  async function avanzarEstado(pedidoId: string, endpoint: string, label: string) {
    if (isMockMode) {
      const NEXT: Record<string, EstadoPedido> = {
        imprimir: 'impreso', surtir: 'surtido', verificar: 'verificado', checador: 'verificado', cerrar: 'cerrado',
      }
      setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, estado: NEXT[endpoint] ?? p.estado } : p))
      setSelected(prev => prev ? { ...prev, estado: NEXT[endpoint] ?? prev.estado } : prev)
      toast.success(`${label} (modo demo)`)
      return
    }
    try {
      await api.patch(`/pedidos/venta/${pedidoId}/${endpoint}`)
      toast.success(label)
      const [list, detail] = await Promise.all([
        api.get('/pedidos/venta'),
        api.get(`/pedidos/venta/${pedidoId}`),
      ])
      setPedidos(Array.isArray(list.data) ? list.data : pedidos)
      setSelected(detail.data)
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? `Error: ${label}`)
    }
  }

  // ── Crear pedido ──
  async function crearPedido(payload: { nombre_cliente: string; notas: string; items: ItemNuevo[] }) {
    if (isMockMode) {
      const nuevo: PedidoDetalle = {
        id: `mock-${Date.now()}`,
        folio: `PV-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        estado: 'pendiente_confirmacion',
        nombre_cliente: payload.nombre_cliente,
        notas: payload.notas,
        created_at: new Date().toISOString(),
        vendedora: { nombre: user?.nombre ?? 'Vendedora' },
        items_pedido_venta: payload.items.map((it, i) => ({
          id: `ni-${i}`,
          producto_id: it.producto_id,
          cantidad: it.cantidad,
          estado_confirmacion: 'pendiente',
          productos: { nombre: it.nombre, codigo: it.producto_id },
        })),
      }
      setPedidos(prev => [nuevo, ...prev])
      setSelected(nuevo)
      setShowNuevo(false)
      toast.success('Pedido creado (modo demo)')
      return
    }
    try {
      const { data } = await api.post('/pedidos/venta', payload)
      toast.success(`Pedido ${data.folio} creado`)
      const list = await api.get('/pedidos/venta')
      setPedidos(Array.isArray(list.data) ? list.data : pedidos)
      setSelected(data)
      setShowNuevo(false)
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Error al crear pedido')
    }
  }

  // ── Helpers ──
  const todosConfirmados = (items: ItemPedido[] = []) =>
    items.length > 0 && items.every(i => i.estado_confirmacion !== 'pendiente')

  const puedeImprimir = (p: PedidoDetalle) =>
    p.estado === 'confirmado' && todosConfirmados(p.items_pedido_venta)

  if (loading) return (
    <div className="p-8 flex items-center justify-center gap-3 text-gray-400">
      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      Cargando pedidos...
    </div>
  )

  return (
    <div className="p-4 md:p-6 flex flex-col md:flex-row gap-5 h-full min-h-0">
      {/* ── Panel izquierdo: lista ── */}
      <div className="w-full md:w-80 flex-shrink-0 flex flex-col gap-2">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Pedidos de Venta</h1>
            {isMockMode && (
              <span className="text-xs text-amber-500">⚠ Modo demo — sin conexión al API</span>
            )}
          </div>
          {(can('pedidos_venta', 'CREAR') || nivel >= 7) && (
            <button
              onClick={() => setShowNuevo(true)}
              className="flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={14} /> Nuevo
            </button>
          )}
        </div>

        <div className="space-y-2 overflow-y-auto flex-1">
          {pedidos.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">Sin pedidos</p>
          )}
          {pedidos.map(p => {
            const est = ESTADO_LABELS[p.estado] ?? { label: p.estado, color: 'bg-gray-100 text-gray-600' }
            return (
              <button key={p.id} onClick={() => loadDetail(p.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  selected?.id === p.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">{p.folio}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${est.color}`}>{est.label}</span>
                </div>
                <p className="text-sm text-gray-800 dark:text-white truncate">{p.nombre_cliente ?? 'Sin nombre'}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {p.vendedora?.nombre} · {new Date(p.created_at).toLocaleDateString('es-MX')}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Panel derecho: detalle ── */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 overflow-y-auto min-h-0">
        {!selected && !detailLoading && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
            <Eye size={40} strokeWidth={1} />
            <p>Selecciona un pedido para ver el detalle</p>
          </div>
        )}

        {detailLoading && (
          <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            Cargando detalle...
          </div>
        )}

        {selected && !detailLoading && (
          <div className="space-y-5">
            {/* Cabecera */}
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white font-mono">{selected.folio}</h2>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${(ESTADO_LABELS[selected.estado] ?? ESTADO_LABELS.borrador).color}`}>
                    {(ESTADO_LABELS[selected.estado] ?? { label: selected.estado }).label}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {selected.nombre_cliente ?? '—'} · {selected.sucursales?.nombre}
                </p>
                {selected.notas && (
                  <p className="text-xs text-gray-400 mt-1 italic">"{selected.notas}"</p>
                )}
              </div>

              {/* Botones de acción según estado y rol */}
              <div className="flex flex-wrap gap-2">
                {/* Vendedora: imprimir nota — solo si TODOS los items confirmados */}
                {puedeImprimir(selected) && (can('pedidos_venta', 'IMPRIMIR') || nivel >= 7) && (
                  <button
                    onClick={() => avanzarEstado(selected.id, 'imprimir', 'Nota impresa')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Printer size={14} /> Imprimir nota
                  </button>
                )}

                {/* Advertencia si hay items sin confirmar */}
                {selected.estado === 'confirmado' && !todosConfirmados(selected.items_pedido_venta) && (
                  <span className="text-xs text-amber-600 dark:text-amber-400 self-center">
                    ⚠ Hay items sin confirmar
                  </span>
                )}

                {/* Almacenista: surtir */}
                {selected.estado === 'impreso' && (can('pedidos_venta', 'EDITAR') || nivel <= 6) && (
                  <button
                    onClick={() => avanzarEstado(selected.id, 'surtir', 'Pedido surtido')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    <Package size={14} /> Confirmar surtido
                  </button>
                )}

                {/* Vendedora: verificar */}
                {selected.estado === 'surtido' && (can('pedidos_venta', 'EDITAR') || nivel >= 7) && (
                  <button
                    onClick={() => avanzarEstado(selected.id, 'verificar', 'Pedido verificado')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    <CheckCircle size={14} /> Verificar pedido
                  </button>
                )}

                {/* Checador */}
                {selected.estado === 'verificado' && (can('pedidos_venta', 'APROBAR') || nivel <= 5) && (
                  <button
                    onClick={() => avanzarEstado(selected.id, 'checador', 'Checador escaneó')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                  >
                    Escanear (Checador)
                  </button>
                )}

                {/* Personal de puerta: cerrar */}
                {selected.estado === 'verificado' && (can('pedidos_venta', 'APROBAR') || nivel <= 4) && (
                  <button
                    onClick={() => avanzarEstado(selected.id, 'cerrar', 'Pedido cerrado')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Cerrar pedido (Puerta)
                  </button>
                )}
              </div>
            </div>

            {/* Flujo visual */}
            <FlujoEstado estado={selected.estado} />

            {/* Tabla de items */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Items del pedido</h3>
              <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-700">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500 dark:text-gray-400">
                    <tr>
                      <th className="px-3 py-2 text-left">Producto</th>
                      <th className="px-3 py-2 text-center">Cant.</th>
                      <th className="px-3 py-2 text-center">Estado</th>
                      {['pendiente_confirmacion', 'confirmado'].includes(selected.estado) && (can('pedidos_venta', 'EDITAR') || nivel <= 6) && (
                        <th className="px-3 py-2 text-center">Acción</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {(selected.items_pedido_venta ?? []).map((item) => {
                      const ist = ITEM_ESTADO_LABELS[item.estado_confirmacion] ?? { label: item.estado_confirmacion, color: '' }
                      return (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                          <td className="px-3 py-2 text-gray-800 dark:text-gray-200">
                            <p className="font-medium">{item.productos?.nombre ?? item.producto_id}</p>
                            <p className="text-xs text-gray-400">{item.productos?.codigo}</p>
                            {item.sustituto && (
                              <p className="text-xs text-blue-500">↳ Sustituto: {item.sustituto.nombre}</p>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300 font-medium">
                            {item.cantidad}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ist.color}`}>
                              {ist.label}
                            </span>
                          </td>
                          {['pendiente_confirmacion', 'confirmado'].includes(selected.estado) && (can('pedidos_venta', 'EDITAR') || nivel <= 6) && (
                            <td className="px-3 py-2 text-center">
                              {item.estado_confirmacion === 'pendiente' && (
                                <div className="flex gap-1 justify-center">
                                  <button
                                    onClick={() => confirmarItem(selected.id, item.id, 'confirmado')}
                                    className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                    title="Confirmar"
                                  >✓</button>
                                  <button
                                    onClick={() => confirmarItem(selected.id, item.id, 'sin_stock')}
                                    className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                    title="Sin stock"
                                  >✗</button>
                                  <button
                                    onClick={() => confirmarItem(selected.id, item.id, 'sustituto')}
                                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                    title="Sustituto"
                                  >⇄</button>
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal nuevo pedido ── */}
      {showNuevo && (
        <NuevoPedidoModal
          onClose={() => setShowNuevo(false)}
          onSubmit={crearPedido}
        />
      )}
    </div>
  )
}

// ─── Flujo visual de estados ──────────────────────────────────────────────────

const FLUJO: EstadoPedido[] = ['borrador', 'pendiente_confirmacion', 'confirmado', 'impreso', 'surtido', 'verificado', 'cerrado']

function FlujoEstado({ estado }: { estado: string }) {
  const idx = FLUJO.indexOf(estado as EstadoPedido)
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {FLUJO.map((e, i) => {
        const est = ESTADO_LABELS[e]
        const done = idx > i
        const active = idx === i
        return (
          <div key={e} className="flex items-center gap-1 shrink-0">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
              active ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' :
              done   ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                       'bg-gray-100 text-gray-400 dark:bg-gray-700/50 dark:text-gray-500'
            }`}>
              {done && <CheckCircle size={10} />}
              {est?.label ?? e}
            </div>
            {i < FLUJO.length - 1 && (
              <ChevronDown size={10} className="text-gray-300 dark:text-gray-600 rotate-[-90deg] shrink-0" />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Modal de nuevo pedido ────────────────────────────────────────────────────

interface ClienteSugerido {
  id: string
  nombre: string
  rfc?: string
  telefono?: string
}

interface ItemNuevoEnhanced extends ItemNuevo {
  codigo: string
  buscando: boolean
}

const PUBLICO_GENERAL: ClienteSugerido = { id: 'publico', nombre: 'Público en general' }

function NuevoPedidoModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (data: { nombre_cliente: string; notas: string; items: ItemNuevo[] }) => void
}) {
  const user = useAuthStore(s => s.user)

  // Cliente
  const [clienteQuery, setClienteQuery] = useState('')
  const [clienteSugeridos, setClienteSugeridos] = useState<ClienteSugerido[]>([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteSugerido | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [buscandoCliente, setBuscandoCliente] = useState(false)

  // Items
  const [items, setItems] = useState<ItemNuevoEnhanced[]>([
    { producto_id: '', codigo: '', nombre: '', cantidad: 1, buscando: false },
  ])
  const [notas, setNotas] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // ── Búsqueda de clientes (debounced) ──
  useEffect(() => {
    if (!clienteQuery.trim() || clienteSeleccionado) {
      setClienteSugeridos([])
      return
    }
    const timer = setTimeout(async () => {
      setBuscandoCliente(true)
      try {
        const { data } = await api.get(`/clientes?search=${encodeURIComponent(clienteQuery)}`)
        const lista: ClienteSugerido[] = Array.isArray(data) ? data : []
        setClienteSugeridos([PUBLICO_GENERAL, ...lista])
        setShowDropdown(true)
      } catch {
        setClienteSugeridos([PUBLICO_GENERAL])
        setShowDropdown(true)
      } finally {
        setBuscandoCliente(false)
      }
    }, 350)
    return () => clearTimeout(timer)
  }, [clienteQuery, clienteSeleccionado])

  function seleccionarCliente(c: ClienteSugerido) {
    setClienteSeleccionado(c)
    setClienteQuery(c.nombre)
    setShowDropdown(false)
    setClienteSugeridos([])
  }

  function limpiarCliente() {
    setClienteSeleccionado(null)
    setClienteQuery('')
  }

  // ── Búsqueda de producto por código ──
  async function buscarProductoPorCodigo(idx: number, codigo: string) {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, codigo, buscando: true } : it))
    try {
      const { data } = await api.get(`/productos?codigo=${encodeURIComponent(codigo)}`)
      const prod = Array.isArray(data) ? data[0] : data
      if (prod?.id) {
        setItems(prev => prev.map((it, i) =>
          i === idx ? { ...it, producto_id: prod.id, nombre: prod.nombre ?? prod.descripcion ?? codigo, buscando: false } : it
        ))
      } else {
        setItems(prev => prev.map((it, i) => i === idx ? { ...it, producto_id: codigo, nombre: '', buscando: false } : it))
      }
    } catch {
      setItems(prev => prev.map((it, i) => i === idx ? { ...it, producto_id: codigo, buscando: false } : it))
    }
  }

  function addItem() {
    setItems(prev => [...prev, { producto_id: '', codigo: '', nombre: '', cantidad: 1, buscando: false }])
  }

  function removeItem(i: number) {
    setItems(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateItem(i: number, field: keyof ItemNuevoEnhanced, value: string | number | boolean) {
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [field]: value } : it))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nombre_cliente = clienteSeleccionado?.nombre ?? clienteQuery.trim()
    if (!nombre_cliente) { toast.error('Ingresa o selecciona un cliente'); return }
    if (items.some(it => !it.codigo.trim())) { toast.error('Todos los productos deben tener código'); return }
    setSubmitting(true)
    await onSubmit({
      nombre_cliente,
      notas,
      items: items.map(it => ({ producto_id: it.producto_id || it.codigo, nombre: it.nombre || it.codigo, cantidad: it.cantidad })),
    })
    setSubmitting(false)
  }

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Nuevo Pedido de Venta</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Número de agente (read-only) */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Número de agente</label>
            <div className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400">
              {user?.numero_agente ?? <span className="italic text-gray-400">Sin número de agente</span>}
            </div>
          </div>

          {/* Cliente con autocomplete */}
          <div className="relative">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Cliente *</label>
            <div className="relative">
              <input
                className={inputCls}
                placeholder="Escribe para buscar cliente..."
                value={clienteQuery}
                onChange={e => { setClienteQuery(e.target.value); setClienteSeleccionado(null) }}
                onFocus={() => clienteSugeridos.length > 0 && setShowDropdown(true)}
                autoComplete="off"
              />
              {buscandoCliente && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {clienteSeleccionado && (
                <button type="button" onClick={limpiarCliente}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Dropdown sugerencias */}
            {showDropdown && clienteSugeridos.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg overflow-hidden">
                {clienteSugeridos.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => seleccionarCliente(c)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors border-b border-gray-100 dark:border-gray-600 last:border-0"
                  >
                    <p className={`font-medium ${c.id === 'publico' ? 'text-gray-400 italic' : 'text-gray-900 dark:text-white'}`}>{c.nombre}</p>
                    {c.rfc && <p className="text-xs text-gray-400">RFC: {c.rfc}</p>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Notas</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={2}
              placeholder="Observaciones opcionales..."
              value={notas}
              onChange={e => setNotas(e.target.value)}
            />
          </div>

          {/* Productos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Productos *</label>
            </div>

            {/* Encabezado columnas */}
            <div className="grid grid-cols-[100px_1fr_80px_32px] gap-2 mb-1 px-1">
              <span className="text-[10px] uppercase text-gray-400 font-medium">Código</span>
              <span className="text-[10px] uppercase text-gray-400 font-medium">Descripción</span>
              <span className="text-[10px] uppercase text-gray-400 font-medium text-center">Cant.</span>
              <span />
            </div>

            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-[100px_1fr_80px_32px] gap-2 items-center">
                  {/* Código */}
                  <div className="relative">
                    <input
                      className="w-full px-2 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      placeholder="COD-001"
                      value={item.codigo}
                      onChange={e => {
                        const val = e.target.value.toUpperCase()
                        updateItem(i, 'codigo', val)
                        if (val.length >= 3) buscarProductoPorCodigo(i, val)
                        else updateItem(i, 'nombre', '')
                      }}
                      required
                    />
                    {item.buscando && (
                      <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                        <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Descripción */}
                  <input
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Descripción del producto"
                    value={item.nombre}
                    onChange={e => updateItem(i, 'nombre', e.target.value)}
                  />

                  {/* Cantidad */}
                  <input
                    type="number"
                    min={1}
                    maxLength={4}
                    className="w-full px-2 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                    value={item.cantidad}
                    onChange={e => updateItem(i, 'cantidad', Math.max(1, parseInt(e.target.value) || 1))}
                  />

                  {/* Agregar / Eliminar */}
                  {i === items.length - 1 ? (
                    <button
                      type="button"
                      onClick={addItem}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors text-lg font-bold"
                      title="Agregar fila"
                    >+</button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 transition-colors"
                      title="Eliminar fila"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              El código busca automáticamente el producto en el catálogo.
            </p>
          </div>

          {/* Acciones */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 px-4 py-2.5 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors font-semibold">
              {submitting ? 'Creando...' : 'Crear pedido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
