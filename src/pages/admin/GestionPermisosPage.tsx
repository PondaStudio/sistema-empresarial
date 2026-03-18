import { useEffect, useState, useMemo } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'

// ─── Tipos ───────────────────────────────────────────────────────────────────
interface Subfuncion {
  id: string
  modulo: string
  slug: string
  nombre: string
  orden: number
}

interface UserOption {
  id: string
  nombre: string
  email: string
  roles?: { nivel: number; nombre: string }
}

type Nivel = 0 | 1 | 2

// ─── Subfunciones estáticas (fallback cuando API no disponible) ───────────────
const SF: Subfuncion[] = [
  // Inventario
  { id: 'inventario__buscar_producto',   modulo: 'inventario', slug: 'buscar_producto',   nombre: 'Buscar producto',         orden: 1 },
  { id: 'inventario__recibir_producto',  modulo: 'inventario', slug: 'recibir_producto',  nombre: 'Recibir producto',        orden: 2 },
  { id: 'inventario__alta_producto',     modulo: 'inventario', slug: 'alta_producto',     nombre: 'Dar de alta producto',    orden: 3 },
  { id: 'inventario__baja_producto',     modulo: 'inventario', slug: 'baja_producto',     nombre: 'Baja de producto',        orden: 4 },
  { id: 'inventario__traspaso',          modulo: 'inventario', slug: 'traspaso',          nombre: 'Traspaso',                orden: 5 },
  { id: 'inventario__inventario_fisico', modulo: 'inventario', slug: 'inventario_fisico', nombre: 'Inventario físico',       orden: 6 },
  { id: 'inventario__generar_etiquetas', modulo: 'inventario', slug: 'generar_etiquetas', nombre: 'Generar etiquetas',       orden: 7 },
  { id: 'inventario__notas_recepcion',   modulo: 'inventario', slug: 'notas_recepcion',   nombre: 'Notas de recepción',      orden: 8 },
  // Pedidos de venta
  { id: 'pedidos_venta__crear_pedido',      modulo: 'pedidos_venta', slug: 'crear_pedido',      nombre: 'Crear pedido',        orden: 1 },
  { id: 'pedidos_venta__ver_pedidos',       modulo: 'pedidos_venta', slug: 'ver_pedidos',       nombre: 'Ver pedidos',         orden: 2 },
  { id: 'pedidos_venta__imprimir_nota',     modulo: 'pedidos_venta', slug: 'imprimir_nota',     nombre: 'Imprimir nota',       orden: 3 },
  { id: 'pedidos_venta__confirmar_surtido', modulo: 'pedidos_venta', slug: 'confirmar_surtido', nombre: 'Confirmar surtido',   orden: 4 },
  { id: 'pedidos_venta__escanear_entrega',  modulo: 'pedidos_venta', slug: 'escanear_entrega',  nombre: 'Escanear entrega',    orden: 5 },
  { id: 'pedidos_venta__cancelar_pedido',   modulo: 'pedidos_venta', slug: 'cancelar_pedido',   nombre: 'Cancelar pedido',     orden: 6 },
  // Pedidos a proveedor
  { id: 'pedidos_proveedor__ver_pedidos_proveedor',  modulo: 'pedidos_proveedor', slug: 'ver_pedidos_proveedor',  nombre: 'Ver pedidos',         orden: 1 },
  { id: 'pedidos_proveedor__crear_pedido_proveedor', modulo: 'pedidos_proveedor', slug: 'crear_pedido_proveedor', nombre: 'Crear pedido',        orden: 2 },
  { id: 'pedidos_proveedor__recibir_pedido',         modulo: 'pedidos_proveedor', slug: 'recibir_pedido',         nombre: 'Recibir pedido',      orden: 3 },
  { id: 'pedidos_proveedor__notas_recepcion_prov',   modulo: 'pedidos_proveedor', slug: 'notas_recepcion_prov',   nombre: 'Notas de recepción',  orden: 4 },
  // Comunicación
  { id: 'comunicacion__ver_canales',       modulo: 'comunicacion', slug: 'ver_canales',       nombre: 'Ver canales',       orden: 1 },
  { id: 'comunicacion__enviar_mensajes',   modulo: 'comunicacion', slug: 'enviar_mensajes',   nombre: 'Enviar mensajes',   orden: 2 },
  { id: 'comunicacion__crear_canales',     modulo: 'comunicacion', slug: 'crear_canales',     nombre: 'Crear canales',     orden: 3 },
  { id: 'comunicacion__mensajes_directos', modulo: 'comunicacion', slug: 'mensajes_directos', nombre: 'Mensajes directos', orden: 4 },
  { id: 'comunicacion__notas_de_voz',      modulo: 'comunicacion', slug: 'notas_de_voz',      nombre: 'Notas de voz',      orden: 5 },
  // RRHH
  { id: 'rrhh__ver_expediente',             modulo: 'rrhh', slug: 'ver_expediente',             nombre: 'Ver expediente',                orden: 1 },
  { id: 'rrhh__ver_asistencia',             modulo: 'rrhh', slug: 'ver_asistencia',             nombre: 'Ver asistencia',                orden: 2 },
  { id: 'rrhh__ver_bonos',                  modulo: 'rrhh', slug: 'ver_bonos',                  nombre: 'Ver bonos',                     orden: 3 },
  { id: 'rrhh__registrar_llamada_atencion', modulo: 'rrhh', slug: 'registrar_llamada_atencion', nombre: 'Registrar llamada de atención', orden: 4 },
  { id: 'rrhh__ver_vacaciones',             modulo: 'rrhh', slug: 'ver_vacaciones',             nombre: 'Ver vacaciones',                orden: 5 },
  // Tareas
  { id: 'tareas__ver_tareas',       modulo: 'tareas', slug: 'ver_tareas',       nombre: 'Ver tareas',       orden: 1 },
  { id: 'tareas__crear_tareas',     modulo: 'tareas', slug: 'crear_tareas',     nombre: 'Crear tareas',     orden: 2 },
  { id: 'tareas__completar_tareas', modulo: 'tareas', slug: 'completar_tareas', nombre: 'Completar tareas', orden: 3 },
  { id: 'tareas__aprobar_tareas',   modulo: 'tareas', slug: 'aprobar_tareas',   nombre: 'Aprobar tareas',   orden: 4 },
  { id: 'tareas__asignar_tareas',   modulo: 'tareas', slug: 'asignar_tareas',   nombre: 'Asignar tareas',   orden: 5 },
  // Dashboard
  { id: 'dashboard__ver_kpis_propios',  modulo: 'dashboard', slug: 'ver_kpis_propios',  nombre: 'Ver KPIs propios',     orden: 1 },
  { id: 'dashboard__ver_kpis_sucursal', modulo: 'dashboard', slug: 'ver_kpis_sucursal', nombre: 'Ver KPIs de sucursal', orden: 2 },
  { id: 'dashboard__ver_kpis_globales', modulo: 'dashboard', slug: 'ver_kpis_globales', nombre: 'Ver KPIs globales',    orden: 3 },
  { id: 'dashboard__exportar_reportes', modulo: 'dashboard', slug: 'exportar_reportes', nombre: 'Exportar reportes',    orden: 4 },
  // Facturación
  { id: 'facturacion__ver_facturas',     modulo: 'facturacion', slug: 'ver_facturas',     nombre: 'Ver facturas',      orden: 1 },
  { id: 'facturacion__crear_factura',    modulo: 'facturacion', slug: 'crear_factura',    nombre: 'Crear factura',     orden: 2 },
  { id: 'facturacion__imprimir_factura', modulo: 'facturacion', slug: 'imprimir_factura', nombre: 'Imprimir factura',  orden: 3 },
  // Paqueterías
  { id: 'paqueterias__ver_envios',       modulo: 'paqueterias', slug: 'ver_envios',       nombre: 'Ver envíos',            orden: 1 },
  { id: 'paqueterias__crear_hoja_envio', modulo: 'paqueterias', slug: 'crear_hoja_envio', nombre: 'Crear hoja de envío',   orden: 2 },
  { id: 'paqueterias__imprimir_hoja',    modulo: 'paqueterias', slug: 'imprimir_hoja',    nombre: 'Imprimir hoja',         orden: 3 },
  // Clientes
  { id: 'clientes__buscar_cliente',     modulo: 'clientes', slug: 'buscar_cliente',     nombre: 'Buscar cliente',     orden: 1 },
  { id: 'clientes__crear_cliente',      modulo: 'clientes', slug: 'crear_cliente',      nombre: 'Crear cliente',      orden: 2 },
  { id: 'clientes__ver_historial',      modulo: 'clientes', slug: 'ver_historial',      nombre: 'Ver historial',      orden: 3 },
  { id: 'clientes__ver_datos_fiscales', modulo: 'clientes', slug: 'ver_datos_fiscales', nombre: 'Ver datos fiscales', orden: 4 },
  // Catálogo
  { id: 'catalogo__buscar_producto_catalogo', modulo: 'catalogo', slug: 'buscar_producto_catalogo', nombre: 'Buscar producto',          orden: 1 },
  { id: 'catalogo__ver_detalles_producto',    modulo: 'catalogo', slug: 'ver_detalles_producto',    nombre: 'Ver detalles de producto', orden: 2 },
  // Avisos
  { id: 'avisos__ver_avisos',      modulo: 'avisos', slug: 'ver_avisos',      nombre: 'Ver avisos',      orden: 1 },
  { id: 'avisos__crear_avisos',    modulo: 'avisos', slug: 'crear_avisos',    nombre: 'Crear avisos',    orden: 2 },
  { id: 'avisos__publicar_avisos', modulo: 'avisos', slug: 'publicar_avisos', nombre: 'Publicar avisos', orden: 3 },
  // Capacitación
  { id: 'capacitacion__ver_cursos',       modulo: 'capacitacion', slug: 'ver_cursos',       nombre: 'Ver cursos',       orden: 1 },
  { id: 'capacitacion__completar_cursos', modulo: 'capacitacion', slug: 'completar_cursos', nombre: 'Completar cursos', orden: 2 },
  { id: 'capacitacion__asignar_cursos',   modulo: 'capacitacion', slug: 'asignar_cursos',   nombre: 'Asignar cursos',   orden: 3 },
  { id: 'capacitacion__crear_cursos',     modulo: 'capacitacion', slug: 'crear_cursos',     nombre: 'Crear cursos',     orden: 4 },
  // Promociones
  { id: 'promociones__ver_promociones',    modulo: 'promociones', slug: 'ver_promociones',    nombre: 'Ver promociones',    orden: 1 },
  { id: 'promociones__descargar_material', modulo: 'promociones', slug: 'descargar_material', nombre: 'Descargar material', orden: 2 },
  { id: 'promociones__crear_promocion',    modulo: 'promociones', slug: 'crear_promocion',    nombre: 'Crear promoción',    orden: 3 },
  { id: 'promociones__publicar_promocion', modulo: 'promociones', slug: 'publicar_promocion', nombre: 'Publicar promoción', orden: 4 },
]

// ─── Metadatos visuales por módulo ───────────────────────────────────────────
const MODULO_META: Record<string, { label: string; icon: string; ring: string; bg: string; text: string }> = {
  inventario:          { label: 'Inventario',           icon: '📦', ring: 'ring-blue-200',     bg: 'bg-blue-50',     text: 'text-blue-700'    },
  pedidos_venta:       { label: 'Pedidos de Venta',     icon: '🛒', ring: 'ring-emerald-200',  bg: 'bg-emerald-50',  text: 'text-emerald-700' },
  pedidos_proveedor:   { label: 'Pedidos a Proveedor',  icon: '🏭', ring: 'ring-teal-200',     bg: 'bg-teal-50',     text: 'text-teal-700'    },
  comunicacion:        { label: 'Comunicación',         icon: '💬', ring: 'ring-purple-200',   bg: 'bg-purple-50',   text: 'text-purple-700'  },
  rrhh:                { label: 'RRHH',                 icon: '👥', ring: 'ring-pink-200',     bg: 'bg-pink-50',     text: 'text-pink-700'    },
  tareas:              { label: 'Tareas',               icon: '✅', ring: 'ring-yellow-200',   bg: 'bg-yellow-50',   text: 'text-yellow-700'  },
  dashboard:           { label: 'Dashboard',            icon: '📊', ring: 'ring-indigo-200',   bg: 'bg-indigo-50',   text: 'text-indigo-700'  },
  facturacion:         { label: 'Facturación',          icon: '🧾', ring: 'ring-orange-200',   bg: 'bg-orange-50',   text: 'text-orange-700'  },
  paqueterias:         { label: 'Paqueterías',          icon: '📫', ring: 'ring-red-200',      bg: 'bg-red-50',      text: 'text-red-700'     },
  clientes:            { label: 'Clientes',             icon: '🧑‍💼', ring: 'ring-cyan-200',    bg: 'bg-cyan-50',     text: 'text-cyan-700'    },
  catalogo:            { label: 'Catálogo',             icon: '📋', ring: 'ring-lime-200',     bg: 'bg-lime-50',     text: 'text-lime-700'    },
  avisos:              { label: 'Avisos',               icon: '📢', ring: 'ring-amber-200',    bg: 'bg-amber-50',    text: 'text-amber-700'   },
  capacitacion:        { label: 'Capacitación',         icon: '🎓', ring: 'ring-violet-200',   bg: 'bg-violet-50',   text: 'text-violet-700'  },
  promociones:         { label: 'Promociones',          icon: '🏷️', ring: 'ring-rose-200',    bg: 'bg-rose-50',     text: 'text-rose-700'    },
}

const NIVEL_COLORS = [
  'bg-violet-600', 'bg-blue-600', 'bg-sky-600', 'bg-cyan-600', 'bg-teal-600',
  'bg-emerald-600', 'bg-green-600', 'bg-lime-600', 'bg-amber-600', 'bg-orange-600',
  'bg-rose-600', 'bg-red-600',
]
function avatarColor(nivel = 1) { return NIVEL_COLORS[Math.min(nivel - 1, NIVEL_COLORS.length - 1)] }
function initials(nombre: string) { return nombre.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() }
function cycleNivel(n: Nivel): Nivel { return n === 0 ? 2 : n === 2 ? 1 : 0 }

// ─── Componente toggle 3 estados ─────────────────────────────────────────────
function NivelBadge({ nivel, onChange }: { nivel: Nivel; onChange: (n: Nivel) => void }) {
  const styles: Record<Nivel, string> = {
    0: 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200',
    1: 'bg-yellow-50 text-yellow-700 border-yellow-300 hover:bg-yellow-100',
    2: 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100',
  }
  const labels: Record<Nivel, string> = { 0: '❌ Sin acceso', 1: '⚡ Parcial', 2: '✅ Total' }

  return (
    <button
      onClick={() => onChange(cycleNivel(nivel))}
      className={`text-xs font-medium px-3 py-1 rounded-full border transition-all select-none ${styles[nivel]}`}
      title="Click para cambiar nivel"
    >
      {labels[nivel]}
    </button>
  )
}

// ─── Panel de un módulo ───────────────────────────────────────────────────────
function ModuloAccordion({
  modulo,
  subfunciones,
  permisos,
  onToggle,
  isOpen,
  onOpenToggle,
}: {
  modulo: string
  subfunciones: Subfuncion[]
  permisos: Record<string, Nivel>
  onToggle: (id: string, nivel: Nivel) => void
  isOpen: boolean
  onOpenToggle: () => void
}) {
  const meta = MODULO_META[modulo] ?? { label: modulo, icon: '⚙️', ring: 'ring-gray-200', bg: 'bg-gray-50', text: 'text-gray-700' }
  const activos = subfunciones.filter(sf => (permisos[sf.id] ?? 0) > 0).length

  return (
    <div className={`rounded-xl border ring-1 ${meta.ring} overflow-hidden`}>
      {/* Header del acordeón */}
      <button
        onClick={onOpenToggle}
        className={`w-full flex items-center gap-3 px-4 py-3 ${meta.bg} hover:brightness-95 transition-all`}
      >
        <span className="text-lg">{meta.icon}</span>
        <span className={`font-semibold text-sm ${meta.text} flex-1 text-left`}>{meta.label}</span>
        <span className="text-xs text-gray-400 font-normal mr-2">
          {activos}/{subfunciones.length} activas
        </span>
        <span className={`text-gray-400 text-sm transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* Lista de sub-funciones */}
      {isOpen && (
        <div className="bg-white divide-y divide-gray-50">
          {subfunciones.map(sf => (
            <div key={sf.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors">
              <span className="text-sm text-gray-700">{sf.nombre}</span>
              <NivelBadge
                nivel={permisos[sf.id] ?? 0}
                onChange={(nivel) => onToggle(sf.id, nivel)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function GestionPermisosPage() {
  const [usuarios, setUsuarios]             = useState<UserOption[]>([])
  const [search, setSearch]                 = useState('')
  const [selectedUser, setSelectedUser]     = useState<UserOption | null>(null)
  const [subfunciones, setSubfunciones]     = useState<Subfuncion[]>(SF)
  const [permisos, setPermisos]             = useState<Record<string, Nivel>>({})
  const [savedPermisos, setSavedPermisos]   = useState<Record<string, Nivel>>({})
  const [expandedMods, setExpandedMods]     = useState<Set<string>>(new Set())
  const [loadingUser, setLoadingUser]       = useState(false)
  const [saving, setSaving]                 = useState(false)

  // Cargar lista de usuarios
  useEffect(() => {
    api.get('/users')
      .then(r => setUsuarios(Array.isArray(r.data) ? r.data : []))
      .catch(err => {
        console.error('[GestionPermisos] No se pudo cargar usuarios:', err)
        setUsuarios([])
      })
  }, [])

  // Cargar subfunciones desde API (o usar estáticas como fallback)
  useEffect(() => {
    api.get('/subfunciones')
      .then(r => { if (Array.isArray(r.data) && r.data.length > 0) setSubfunciones(r.data) })
      .catch(() => { /* usa SF estáticas */ })
  }, [])

  // Cargar permisos del usuario seleccionado
  const handleSelectUser = async (user: UserOption) => {
    setSelectedUser(user)
    setLoadingUser(true)
    try {
      const { data } = await api.get(`/permisos-granulares/${user.id}`)
      const map: Record<string, Nivel> = {}
      for (const [sfId, info] of Object.entries(data as Record<string, { nivel: number }>)) {
        map[sfId] = (info.nivel ?? 0) as Nivel
      }
      setPermisos(map)
      setSavedPermisos({ ...map })
    } catch {
      // Mock mode: todos en 0
      setPermisos({})
      setSavedPermisos({})
    } finally {
      setLoadingUser(false)
    }
    // Expandir todos los módulos al abrir un usuario
    setExpandedMods(new Set(MODULOS_ORDER))
  }

  const handleToggle = (sfId: string, nivel: Nivel) => {
    setPermisos(prev => ({ ...prev, [sfId]: nivel }))
  }

  const handleSave = async () => {
    if (!selectedUser) return
    setSaving(true)
    try {
      const payload = subfunciones.map(sf => ({
        subfuncion_id: sf.id,
        nivel: permisos[sf.id] ?? 0,
      }))
      await api.put(`/permisos-granulares/${selectedUser.id}`, { permisos: payload })
      setSavedPermisos({ ...permisos })
      toast.success('Permisos guardados correctamente')
    } catch (err) {
      console.error('[GestionPermisos] Error al guardar:', err)
      toast.error('Error al guardar los permisos')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (!selectedUser) return
    if (!confirm(`¿Resetear todos los permisos de ${selectedUser.nombre} al default de su rol?`)) return
    setSaving(true)
    try {
      await api.delete(`/permisos-granulares/${selectedUser.id}/reset`)
      setPermisos({})
      setSavedPermisos({})
      toast.success('Permisos reseteados al rol base')
    } catch (err) {
      console.error('[GestionPermisos] Error al resetear:', err)
      toast.error('Error al resetear permisos')
    } finally {
      setSaving(false)
    }
  }

  // Módulos únicos en orden determinista
  const MODULOS_ORDER = useMemo(() => {
    const seen = new Set<string>()
    return subfunciones.map(sf => sf.modulo).filter(m => { if (seen.has(m)) return false; seen.add(m); return true })
  }, [subfunciones])

  const sfByModulo = useMemo(() => {
    const map: Record<string, Subfuncion[]> = {}
    for (const sf of subfunciones) {
      if (!map[sf.modulo]) map[sf.modulo] = []
      map[sf.modulo].push(sf)
    }
    return map
  }, [subfunciones])

  const filteredUsers = useMemo(() =>
    usuarios.filter(u =>
      u.nombre.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    ), [usuarios, search])

  const isDirty = JSON.stringify(permisos) !== JSON.stringify(savedPermisos)

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Panel izquierdo: lista de usuarios ─────────────────────────── */}
      <aside className="w-72 shrink-0 flex flex-col border-r dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="px-4 pt-5 pb-3 border-b dark:border-gray-700">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Gestión de Permisos</h2>
          <p className="text-xs text-gray-400 mt-0.5">Solo Creador</p>
        </div>
        <div className="px-3 py-2 border-b dark:border-gray-700">
          <input
            type="text"
            placeholder="Buscar usuario..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-sm bg-gray-100 dark:bg-gray-800 border-0 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <ul className="flex-1 overflow-y-auto py-2">
          {filteredUsers.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-gray-400">
              {usuarios.length === 0 ? 'Conectando con el servidor…' : 'Sin resultados'}
            </li>
          )}
          {filteredUsers.map(user => {
            const nivel = user.roles?.nivel ?? 1
            const isSelected = selectedUser?.id === user.id
            return (
              <li key={user.id}>
                <button
                  onClick={() => handleSelectUser(user)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                    isSelected
                      ? 'bg-primary-50 dark:bg-primary-900/30'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full ${avatarColor(nivel)} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                    {initials(user.nombre)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-gray-100'}`}>
                      {user.nombre}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{user.roles?.nombre ?? '—'}</p>
                  </div>
                  <span className="shrink-0 text-[10px] font-bold text-gray-300 dark:text-gray-600">N{nivel}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </aside>

      {/* ── Panel derecho: editor de permisos ──────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
        {!selectedUser ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="text-6xl mb-4">🔑</div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Selecciona un usuario</p>
            <p className="text-gray-400 text-sm mt-1">para ver y editar sus permisos granulares</p>
          </div>
        ) : (
          <>
            {/* Header del editor */}
            <div className="shrink-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full ${avatarColor(selectedUser.roles?.nivel)} flex items-center justify-center text-sm font-bold text-white shrink-0`}>
                {initials(selectedUser.nombre)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 dark:text-white truncate">{selectedUser.nombre}</p>
                <p className="text-sm text-gray-400">{selectedUser.roles?.nombre} · Nivel {selectedUser.roles?.nivel}</p>
              </div>
              {isDirty && (
                <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-1 rounded-full font-medium">
                  Cambios sin guardar
                </span>
              )}
              <button
                onClick={handleReset}
                disabled={saving}
                className="text-sm text-gray-500 hover:text-red-600 border border-gray-200 dark:border-gray-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                Resetear a rol base
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !isDirty}
                className="text-sm bg-primary-600 hover:bg-primary-700 text-white px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50 font-medium"
              >
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>

            {/* Módulos */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingUser ? (
                <div className="text-center py-16 text-gray-400 text-sm">Cargando permisos…</div>
              ) : (
                <div className="space-y-3 max-w-3xl mx-auto">
                  {/* Expandir / colapsar todos */}
                  <div className="flex justify-end gap-3 mb-1">
                    <button
                      onClick={() => setExpandedMods(new Set(MODULOS_ORDER))}
                      className="text-xs text-primary-600 hover:underline"
                    >
                      Expandir todo
                    </button>
                    <button
                      onClick={() => setExpandedMods(new Set())}
                      className="text-xs text-gray-400 hover:underline"
                    >
                      Colapsar todo
                    </button>
                  </div>

                  {MODULOS_ORDER.map(modulo => (
                    <ModuloAccordion
                      key={modulo}
                      modulo={modulo}
                      subfunciones={sfByModulo[modulo] ?? []}
                      permisos={permisos}
                      onToggle={handleToggle}
                      isOpen={expandedMods.has(modulo)}
                      onOpenToggle={() => setExpandedMods(prev => {
                        const next = new Set(prev)
                        next.has(modulo) ? next.delete(modulo) : next.add(modulo)
                        return next
                      })}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
