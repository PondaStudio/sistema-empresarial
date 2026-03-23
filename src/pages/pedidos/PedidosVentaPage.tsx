import { useEffect, useState, useRef } from 'react'
import { Plus, ChevronRight, Clock, CheckCircle2, X, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import { Nota, EstadoNota, ESTADO_LABELS, FLUJO_ESTADOS, MOCK_NOTAS } from './types'
import { QRCodeDisplay } from '../../components/pedidos/QRCodeDisplay'

// ─── Role router ─────────────────────────────────────────────────────────────
export default function PedidosVentaPage() {
  const nivel = useAuthStore(s => s.user?.roles?.nivel ?? 99)
  const navigate = useNavigate()

  useEffect(() => {
    if (nivel <= 8 && nivel >= 8) {
      // Cajera (nivel 8) → caja view, but render inline for now
    } else if (nivel === 9) {
      navigate('/pedidos/surtido', { replace: true })
    }
    // nivel 10+ → vendedora view (stay here)
    // nivel <= 7 → also stay here but see all notes (supervisor view)
  }, [nivel, navigate])

  if (nivel === 8) return <VistaCajaInline />
  return <VistaVendedora />
}

// ─── Barra de progreso del flujo ─────────────────────────────────────────────
function FlujoBarra({ estado }: { estado: string }) {
  const info = ESTADO_LABELS[estado]
  const step = info?.step ?? 0
  const total = 8
  const pct = step > 0 ? Math.round((step / total) * 100) : 0
  return (
    <div className="mt-1.5">
      <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            estado === 'cerrada' ? 'bg-green-500' :
            estado === 'cancelada' || estado === 'con_incidencia' ? 'bg-red-500' :
            'bg-blue-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── Lista lateral de notas ──────────────────────────────────────────────────
function ListaNotas({
  notas, selected, onSelect, onNueva, nivelAcceso,
}: {
  notas: Nota[]
  selected: Nota | null
  onSelect: (n: Nota) => void
  onNueva: () => void
  nivelAcceso: number
}) {
  const [search, setSearch] = useState('')
  const filtered = notas.filter(n =>
    n.folio.toLowerCase().includes(search.toLowerCase()) ||
    n.nombre_cliente.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="w-72 flex-shrink-0 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-bold text-gray-900 dark:text-white">Notas de Venta</h1>
        {nivelAcceso >= 10 && (
          <button onClick={onNueva}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={13} /> Nueva
          </button>
        )}
      </div>
      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Buscar folio o cliente..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="space-y-1.5 overflow-y-auto flex-1">
        {filtered.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-6">Sin notas</p>
        )}
        {filtered.map(n => {
          const est = ESTADO_LABELS[n.estado] ?? ESTADO_LABELS.capturada
          return (
            <button key={n.id} onClick={() => onSelect(n)}
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
              <p className="text-[10px] text-gray-400 mt-0.5">{n.vendedora?.nombre} · {new Date(n.created_at).toLocaleDateString('es-MX')}</p>
              <FlujoBarra estado={n.estado} />
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Detalle de nota ──────────────────────────────────────────────────────────
function DetalleNota({ nota, onEstadoChange }: { nota: Nota; onEstadoChange: (id: string, estado: EstadoNota) => void }) {
  const nivel = useAuthStore(s => s.user?.roles?.nivel ?? 99)
  const est = ESTADO_LABELS[nota.estado] ?? ESTADO_LABELS.capturada

  async function avanzar(endpoint: string, nuevoEstado: EstadoNota, label: string) {
    try {
      await api.patch(`/pedidos/venta/${nota.id}/${endpoint}`)
      onEstadoChange(nota.id, nuevoEstado)
      toast.success(label)
    } catch {
      onEstadoChange(nota.id, nuevoEstado) // optimistic in mock mode
      toast.success(`${label} (demo)`)
    }
  }

  return (
    <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 overflow-y-auto space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-mono text-gray-900 dark:text-white">{nota.folio}</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${est.color}`}>{est.label}</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {nota.nombre_cliente}
            {nota.facturacion && <span className="ml-2 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 px-1.5 py-0.5 rounded">Factura</span>}
            {nota.descuento_especial && <span className="ml-1 text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 px-1.5 py-0.5 rounded">Desc. especial</span>}
          </p>
          {nota.notas && <p className="text-xs text-gray-400 mt-1 italic">"{nota.notas}"</p>}
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap gap-2">
          {nota.estado === 'completa_en_piso' && nivel >= 10 && (
            <button onClick={() => avanzar('validar-piso', 'lista_para_cobro', 'Validado en piso')}
              className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1.5">
              <CheckCircle2 size={14} /> Validar en piso
            </button>
          )}
        </div>
      </div>

      {/* QR si tiene */}
      {(nota.estado === 'lista_para_cobro' || nota.qr_code) && (
        <div className="flex justify-center">
          <QRCodeDisplay folio={nota.folio} size={120} />
        </div>
      )}

      {/* Flujo visual */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {FLUJO_ESTADOS.map((e, i) => {
          const stepInfo = ESTADO_LABELS[e]
          const currentStep = ESTADO_LABELS[nota.estado]?.step ?? 0
          const done = currentStep > stepInfo.step
          const active = nota.estado === e
          return (
            <div key={e} className="flex items-center gap-1 shrink-0">
              <span className={`text-[10px] px-2 py-1 rounded-lg font-medium ${
                active ? 'bg-blue-600 text-white' :
                done ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                'bg-gray-100 text-gray-400 dark:bg-gray-700/50 dark:text-gray-500'
              }`}>
                {done && '✓ '}{stepInfo.label}
              </span>
              {i < FLUJO_ESTADOS.length - 1 && <ChevronRight size={10} className="text-gray-300 dark:text-gray-600 shrink-0" />}
            </div>
          )
        })}
      </div>

      {/* Info vendedora */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <p className="text-gray-500 dark:text-gray-400 mb-0.5">Vendedora</p>
          <p className="font-medium text-gray-900 dark:text-white">{nota.vendedora?.nombre ?? '—'}</p>
          <p className="text-gray-400">Agente: {nota.vendedora?.numero_agente ?? 'Sin asignar'}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <p className="text-gray-500 dark:text-gray-400 mb-0.5">Sucursal</p>
          <p className="font-medium text-gray-900 dark:text-white">{nota.sucursales?.nombre ?? '—'}</p>
          <p className="text-gray-400">{new Date(nota.created_at).toLocaleString('es-MX')}</p>
        </div>
      </div>

      {/* Tabla de items */}
      <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500 dark:text-gray-400">
            <tr>
              <th className="px-3 py-2 text-left w-24">Código</th>
              <th className="px-3 py-2 text-left">Descripción</th>
              <th className="px-3 py-2 text-center w-16">Cant.</th>
              <th className="px-3 py-2 text-center w-20">Surtido</th>
              <th className="px-3 py-2 text-center w-24">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {nota.items.map(item => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td className="px-3 py-2 font-mono text-xs text-gray-600 dark:text-gray-400">{item.codigo}</td>
                <td className="px-3 py-2 text-gray-800 dark:text-gray-200">{item.nombre}</td>
                <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300 font-medium">{item.cantidad}</td>
                <td className="px-3 py-2 text-center text-gray-500 dark:text-gray-400">{item.cantidad_surtida ?? '—'}</td>
                <td className="px-3 py-2 text-center">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    item.estado_item === 'surtido'        ? 'bg-green-100 text-green-700' :
                    item.estado_item === 'no_encontrado'  ? 'bg-red-100 text-red-700' :
                    item.estado_item === 'surtido_parcial'? 'bg-orange-100 text-orange-700' :
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
  )
}

// ─── Vista Vendedora ──────────────────────────────────────────────────────────
function VistaVendedora() {
  const nivel = useAuthStore(s => s.user?.roles?.nivel ?? 99)
  const userId = useAuthStore(s => s.user?.id)
  const [notas, setNotas] = useState<Nota[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Nota | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [isMock, setIsMock] = useState(false)

  useEffect(() => {
    api.get('/pedidos/venta')
      .then(r => setNotas(Array.isArray(r.data) ? r.data : []))
      .catch(() => { setNotas(MOCK_NOTAS); setIsMock(true) })
      .finally(() => setLoading(false))
  }, [])

  function handleEstadoChange(id: string, estado: EstadoNota) {
    setNotas(prev => prev.map(n => n.id === id ? { ...n, estado, qr_code: estado === 'lista_para_cobro' ? n.folio : n.qr_code } : n))
    setSelected(prev => prev?.id === id ? { ...prev, estado, qr_code: estado === 'lista_para_cobro' ? prev.folio : prev.qr_code } : prev)
  }

  async function handleCrear(payload: any) {
    try {
      const { data } = await api.post('/pedidos/venta', payload)
      setNotas(prev => [data, ...prev])
      setSelected(data)
    } catch {
      const nueva: Nota = {
        id: `mock-${Date.now()}`, folio: `PV-${Date.now().toString().slice(-8)}`,
        estado: 'capturada', nombre_cliente: payload.nombre_cliente,
        vendedora_id: userId ?? 'v1',
        vendedora: { nombre: 'Yo', numero_agente: payload.numero_agente },
        sucursal_id: 's1', sucursales: { nombre: 'Mi sucursal' },
        notas: payload.notas, facturacion: payload.facturacion,
        descuento_especial: payload.descuento_especial,
        created_at: new Date().toISOString(),
        items: payload.items.map((it: any, i: number) => ({
          id: `ni-${i}`, producto_id: it.codigo, codigo: it.codigo,
          nombre: it.nombre || it.codigo, cantidad: it.cantidad,
          cantidad_surtida: 0, estado_item: 'pendiente' as const,
        })),
      }
      setNotas(prev => [nueva, ...prev])
      setSelected(nueva)
      toast.success('Nota creada (modo demo)')
    }
    setShowModal(false)
  }

  // Filter: vendedoras see only their own, supervisors see all
  const notasVisibles = nivel >= 10
    ? notas.filter(n => n.vendedora_id === userId)
    : notas

  if (loading) return (
    <div className="p-8 flex items-center gap-3 text-gray-400">
      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      Cargando notas...
    </div>
  )

  return (
    <div className="p-4 md:p-6 flex gap-5 h-full min-h-0">
      {isMock && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-amber-100 text-amber-700 text-xs px-4 py-1.5 rounded-full border border-amber-200 shadow">
          ⚠ Modo demo — sin conexión al API
        </div>
      )}

      <ListaNotas
        notas={notasVisibles}
        selected={selected}
        onSelect={setSelected}
        onNueva={() => setShowModal(true)}
        nivelAcceso={nivel}
      />

      <div className="flex-1 overflow-y-auto min-h-0">
        {!selected ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
            <Clock size={40} strokeWidth={1} />
            <p>Selecciona una nota para ver el detalle</p>
          </div>
        ) : (
          <DetalleNota nota={selected} onEstadoChange={handleEstadoChange} />
        )}
      </div>

      {showModal && <NuevaNotaModal onClose={() => setShowModal(false)} onSubmit={handleCrear} />}
    </div>
  )
}

// ─── Vista Caja (inline para nivel 8) ────────────────────────────────────────
function VistaCajaInline() {
  const navigate = useNavigate()
  useEffect(() => { navigate('/pedidos/caja', { replace: true }) }, [navigate])
  return null
}

// ─── Modal Nueva Nota ─────────────────────────────────────────────────────────
interface ItemForm { codigo: string; nombre: string; cantidad: number; buscando: boolean }

function NuevaNotaModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (d: any) => void }) {
  const user = useAuthStore(s => s.user)
  const [cliente, setCliente] = useState('')
  const [clienteSugeridos, setClienteSugeridos] = useState<{ id: string; nombre: string }[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [notas, setNotas] = useState('')
  const [facturacion, setFacturacion] = useState(false)
  const [descuento, setDescuento] = useState(false)
  const [items, setItems] = useState<ItemForm[]>([{ codigo: '', nombre: '', cantidad: 1, buscando: false }])
  const [submitting, setSubmitting] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  function handleClienteChange(val: string) {
    setCliente(val)
    clearTimeout(timerRef.current)
    if (!val.trim()) { setClienteSugeridos([]); setShowDropdown(false); return }
    timerRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get(`/clientes?search=${encodeURIComponent(val)}`)
        const lista = Array.isArray(data) ? data : []
        setClienteSugeridos([{ id: 'publico', nombre: 'Público en general' }, ...lista])
        setShowDropdown(true)
      } catch {
        setClienteSugeridos([{ id: 'publico', nombre: 'Público en general' }])
        setShowDropdown(true)
      }
    }, 350)
  }

  async function buscarCodigo(idx: number, codigo: string) {
    setItems(p => p.map((it, i) => i === idx ? { ...it, codigo: codigo.toUpperCase(), buscando: true } : it))
    if (codigo.length < 3) {
      setItems(p => p.map((it, i) => i === idx ? { ...it, buscando: false } : it))
      return
    }
    try {
      const { data } = await api.get(`/productos?codigo=${encodeURIComponent(codigo)}`)
      const prod = Array.isArray(data) ? data[0] : data
      setItems(p => p.map((it, i) => i === idx
        ? { ...it, nombre: prod?.nombre ?? prod?.descripcion ?? '', producto_id: prod?.id ?? codigo, buscando: false }
        : it
      ))
    } catch {
      setItems(p => p.map((it, i) => i === idx ? { ...it, buscando: false } : it))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!cliente.trim()) { toast.error('Ingresa el cliente'); return }
    if (items.some(it => !it.codigo.trim())) { toast.error('Todos los productos deben tener código'); return }
    setSubmitting(true)
    await onSubmit({
      nombre_cliente: cliente,
      numero_agente: user?.numero_agente,
      notas, facturacion, descuento_especial: descuento,
      items: items.map(it => ({ codigo: it.codigo, nombre: it.nombre, cantidad: it.cantidad })),
    })
    setSubmitting(false)
  }

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Nueva Nota de Venta</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Número de agente */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Número de agente</label>
            <div className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400">
              {user?.numero_agente ?? <span className="italic text-gray-400">Sin número de agente</span>}
            </div>
          </div>

          {/* Cliente */}
          <div className="relative">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Cliente *</label>
            <input className={inputCls} placeholder="Escribe para buscar..." value={cliente}
              onChange={e => handleClienteChange(e.target.value)} autoComplete="off" required />
            {showDropdown && clienteSugeridos.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg overflow-hidden">
                {clienteSugeridos.map(c => (
                  <button key={c.id} type="button"
                    onClick={() => { setCliente(c.nombre); setShowDropdown(false) }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors border-b border-gray-100 dark:border-gray-600 last:border-0">
                    <span className={c.id === 'publico' ? 'text-gray-400 italic' : 'text-gray-900 dark:text-white font-medium'}>
                      {c.nombre}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Checkboxes */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" checked={facturacion} onChange={e => setFacturacion(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600" />
              Requiere factura
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" checked={descuento} onChange={e => setDescuento(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600" />
              Descuento especial
            </label>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Observaciones</label>
            <textarea className={`${inputCls} resize-none`} rows={2}
              placeholder="Indicaciones especiales..." value={notas} onChange={e => setNotas(e.target.value)} />
          </div>

          {/* Productos */}
          <div>
            <div className="grid grid-cols-[100px_1fr_72px_32px] gap-2 mb-1.5 px-1">
              <span className="text-[10px] uppercase text-gray-400 font-medium">Código</span>
              <span className="text-[10px] uppercase text-gray-400 font-medium">Descripción</span>
              <span className="text-[10px] uppercase text-gray-400 font-medium text-center">Cant.</span>
              <span />
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-[100px_1fr_72px_32px] gap-2 items-center">
                  <div className="relative">
                    <input
                      className="w-full px-2 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
                      placeholder="COD-001"
                      value={item.codigo}
                      onChange={e => buscarCodigo(i, e.target.value)}
                      required
                    />
                    {item.buscando && (
                      <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                        <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  <input
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Descripción"
                    value={item.nombre}
                    onChange={e => setItems(p => p.map((it, idx) => idx === i ? { ...it, nombre: e.target.value } : it))}
                  />
                  <input
                    type="number" min={1}
                    className="w-full px-2 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                    value={item.cantidad}
                    onChange={e => setItems(p => p.map((it, idx) => idx === i ? { ...it, cantidad: Math.max(1, parseInt(e.target.value) || 1) } : it))}
                  />
                  {i === items.length - 1 ? (
                    <button type="button"
                      onClick={() => setItems(p => [...p, { codigo: '', nombre: '', cantidad: 1, buscando: false }])}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 hover:bg-blue-200 transition-colors text-lg font-bold">+</button>
                  ) : (
                    <button type="button"
                      onClick={() => setItems(p => p.filter((_, idx) => idx !== i))}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 transition-colors">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 px-4 py-2.5 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors font-semibold">
              {submitting ? 'Creando...' : 'Crear nota'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
