import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import type { Permisos } from '../../types'
import { getInitials } from '../../utils/strings'

interface MockUser {
  id: string
  nombre: string
  email: string
  rol_id: string
  nivel: number
  rol: string
  gradiente: string
  icon: string
}

const MOCK_USERS: MockUser[] = [
  { id: 'aec92e91-16db-411b-bab5-2fd1e706d610', nombre: 'Christian Ponda',    email: 'pondaxems@gmail.com',     rol_id: 'rol-01', nivel: 1,  rol: 'Creador',                gradiente: 'from-violet-600 via-purple-700 to-purple-900', icon: '👑' },
  { id: 'b324c97a-a1cb-4f47-b29b-efd7f30f5373', nombre: 'Roberto García',     email: 'gerente@empresa.com',     rol_id: 'rol-02', nivel: 2,  rol: 'Gerente General',        gradiente: 'from-blue-600 via-blue-700 to-blue-900',       icon: '🏢' },
  { id: '5d8c6406-e8a1-45e2-a4a8-d2f6234af9a5', nombre: 'Carlos Dueño',       email: 'dueno@empresa.com',       rol_id: 'rol-03', nivel: 3,  rol: 'Supervisor Dueño',       gradiente: 'from-sky-500 via-sky-700 to-sky-900',          icon: '🏛️' },
  { id: '6b1422ab-5273-4b43-b78a-fd389f59cf18', nombre: 'Ana Familiar',       email: 'familiar@empresa.com',    rol_id: 'rol-04', nivel: 4,  rol: 'Supervisor Familiar',    gradiente: 'from-cyan-500 via-cyan-700 to-cyan-900',       icon: '👥' },
  { id: '4cd57c7f-33b4-4a4d-b219-4ac967f184a1', nombre: 'Luis Admin',         email: 'admg2@empresa.com',       rol_id: 'rol-05', nivel: 5,  rol: 'Administrador G2',       gradiente: 'from-teal-500 via-teal-700 to-teal-900',       icon: '⚙️' },
  { id: '8a079946-b8c8-41e7-a52e-50efe21e9e71', nombre: 'María Encargada',    email: 'encargado@empresa.com',   rol_id: 'rol-06', nivel: 6,  rol: 'Encargado de Sucursal',  gradiente: 'from-emerald-500 via-emerald-700 to-emerald-900', icon: '🏪' },
  { id: '957aca8e-8cff-41a1-bf63-3dfc95755a8e', nombre: 'José Bodega',        email: 'bodega@empresa.com',      rol_id: 'rol-07', nivel: 7,  rol: 'Encargado de Bodega',    gradiente: 'from-green-500 via-green-700 to-green-900',    icon: '📦' },
  { id: '343067c0-5e23-4e22-bce4-ff6f487375e3', nombre: 'Pedro Admin',        email: 'admg1@empresa.com',       rol_id: 'rol-08', nivel: 7,  rol: 'Administrador G1',       gradiente: 'from-lime-500 via-lime-700 to-lime-900',       icon: '🗂️' },
  { id: 'bb634c06-9920-4ff8-8cc6-e0cd22757af8', nombre: 'Laura Cajera',       email: 'cajera@empresa.com',      rol_id: 'rol-09', nivel: 8,  rol: 'Cajera',                 gradiente: 'from-amber-500 via-amber-600 to-amber-800',    icon: '💰' },
  { id: 'd99b43d7-134f-4878-891f-34f539626758', nombre: 'Miguel Almacenista', email: 'almacenista@empresa.com', rol_id: 'rol-10', nivel: 9,  rol: 'Almacenista G1',         gradiente: 'from-orange-500 via-orange-700 to-orange-900', icon: '🏗️' },
  { id: '45a6c286-7ba6-4425-91d9-5e8fd108db9e', nombre: 'Sofia Vendedora',    email: 'vendedora@empresa.com',   rol_id: 'rol-11', nivel: 10, rol: 'Vendedora',              gradiente: 'from-rose-500 via-rose-700 to-rose-900',       icon: '🛍️' },
  { id: '3d330838-ba39-4fed-97a6-d9521327ea6a', nombre: 'Diego Promotor',     email: 'promotor@empresa.com',    rol_id: 'rol-12', nivel: 11, rol: 'Promotor de Marca',      gradiente: 'from-red-500 via-red-700 to-red-900',          icon: '📣' },
]

const GRUPOS = [
  { label: 'Alta Dirección',  color: 'text-blue-300',    indices: [1, 2, 3, 4] },
  { label: 'Operaciones',     color: 'text-emerald-300', indices: [5, 6, 7, 8] },
  { label: 'Campo',           color: 'text-orange-300',  indices: [9, 10, 11] },
]

function generatePermisos(nivel: number): Permisos {
  if (nivel === 1) return {}

  const config: Record<number, { modulos: string[]; acciones: string[] }> = {
    2: {
      modulos: ['dashboard','analisis','pedidos_venta','pedidos_proveedor','inventario',
                'comunicacion','rrhh','tareas','facturacion','clientes','capacitacion',
                'evaluaciones','avisos','proveedores','contrataciones','bitacora',
                'formatos','garantias','precios','notificaciones','catalogo'],
      acciones: ['VER','CREAR','EDITAR','EXPORTAR','APROBAR','IMPRIMIR'],
    },
    3: {
      modulos: ['dashboard','analisis','pedidos_venta','pedidos_proveedor','inventario',
                'comunicacion','rrhh','tareas','facturacion','clientes','capacitacion',
                'evaluaciones','avisos','proveedores','bitacora','formatos','garantias',
                'precios','notificaciones','catalogo'],
      acciones: ['VER','CREAR','EDITAR','EXPORTAR','APROBAR','IMPRIMIR'],
    },
    4: {
      modulos: ['dashboard','pedidos_venta','inventario','comunicacion','rrhh','tareas',
                'clientes','capacitacion','evaluaciones','avisos','bitacora','notificaciones'],
      acciones: ['VER','CREAR','EDITAR','EXPORTAR'],
    },
    5: {
      modulos: ['dashboard','pedidos_venta','pedidos_proveedor','inventario','comunicacion',
                'tareas','facturacion','clientes','proveedores','avisos','notificaciones',
                'catalogo','precios'],
      acciones: ['VER','CREAR','EDITAR','EXPORTAR','IMPRIMIR'],
    },
    6: {
      modulos: ['dashboard','pedidos_venta','inventario','comunicacion','tareas',
                'clientes','avisos','notificaciones','catalogo'],
      acciones: ['VER','CREAR','EDITAR'],
    },
    7: {
      modulos: ['dashboard','inventario','pedidos_proveedor','comunicacion','tareas',
                'avisos','notificaciones','catalogo'],
      acciones: ['VER','CREAR','EDITAR'],
    },
    8: {
      modulos: ['dashboard','pedidos_venta','inventario','comunicacion','tareas',
                'clientes','avisos','notificaciones'],
      acciones: ['VER','CREAR'],
    },
    9: {
      modulos: ['dashboard','pedidos_venta','clientes','avisos','notificaciones','catalogo'],
      acciones: ['VER','CREAR'],
    },
    10: {
      modulos: ['dashboard','inventario','comunicacion','avisos','notificaciones'],
      acciones: ['VER','CREAR'],
    },
    11: {
      modulos: ['dashboard','pedidos_venta','clientes','catalogo','avisos','notificaciones'],
      acciones: ['VER','CREAR'],
    },
    12: {
      modulos: ['dashboard','catalogo','avisos','notificaciones'],
      acciones: ['VER'],
    },
  }

  const { modulos, acciones } = config[nivel] ?? config[12]
  const permisos: Permisos = {}
  for (const mod of modulos) {
    permisos[mod] = {}
    for (const acc of acciones) {
      permisos[mod][acc] = true
    }
  }
  return permisos
}

export default function MockLoginPage() {
  const navigate = useNavigate()

  const handleSelect = (user: MockUser) => {
    // Actualización atómica: user + token + permisos en un solo set
    useAuthStore.setState({
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol_id: user.rol_id,
        sucursal_id: null,
        estado_presencia: 'disponible',
        foto_url: null,
        activo: true,
        roles: { nivel: user.nivel, nombre: user.rol },
      },
      token: `mock-${user.id}`,
      permisos: generatePermisos(user.nivel),
    })
    navigate('/dashboard')
  }

  const creador = MOCK_USERS[0]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex flex-col">

      {/* Header */}
      <div className="text-center pt-10 pb-4 px-4">
        <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-xs font-bold px-4 py-1.5 rounded-full mb-4 tracking-widest uppercase">
          ⚠️ Modo Prueba — Solo Desarrollo
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight">Sistema Empresarial</h1>
        <p className="text-slate-400 mt-2 text-sm">Selecciona un usuario para explorar su vista y permisos</p>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 pb-12 pt-6 space-y-8">

        {/* Creador — tarjeta destacada */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-violet-400 mb-3 flex items-center gap-2">
            <span className="h-px flex-1 bg-violet-900/60" />
            Súper Admin
            <span className="h-px flex-1 bg-violet-900/60" />
          </p>
          <button
            onClick={() => handleSelect(creador)}
            className={`w-full group relative overflow-hidden rounded-2xl bg-gradient-to-r ${creador.gradiente} border border-white/10 p-5 flex items-center gap-5 hover:scale-[1.015] hover:shadow-2xl hover:shadow-violet-900/60 transition-all duration-200 cursor-pointer`}
          >
            <div className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center text-xl font-bold text-white border-2 border-white/30 shrink-0">
              {getInitials(creador.nombre)}
            </div>
            <div className="text-left">
              <p className="text-white font-bold text-xl leading-tight">{creador.nombre}</p>
              <p className="text-violet-200 text-sm mt-0.5">{creador.rol}</p>
              <p className="text-violet-300/60 text-xs mt-1">Acceso total a todos los módulos</p>
            </div>
            <div className="ml-auto flex flex-col items-end gap-2 shrink-0">
              <span className="text-3xl">{creador.icon}</span>
              <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
                Nivel 1
              </span>
            </div>
          </button>
        </div>

        {/* Grupos de usuarios */}
        {GRUPOS.map(grupo => (
          <div key={grupo.label}>
            <p className={`text-xs font-bold uppercase tracking-widest ${grupo.color} mb-3 flex items-center gap-2`}>
              <span className="h-px flex-1 bg-white/10" />
              {grupo.label}
              <span className="h-px flex-1 bg-white/10" />
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {grupo.indices.map(i => {
                const user = MOCK_USERS[i]
                return (
                  <button
                    key={user.id}
                    onClick={() => handleSelect(user)}
                    className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${user.gradiente} border border-white/10 p-4 flex flex-col gap-3 hover:scale-[1.03] hover:shadow-xl hover:border-white/20 transition-all duration-200 cursor-pointer text-left`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center text-sm font-bold text-white border-2 border-white/25 shrink-0">
                        {getInitials(user.nombre)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm leading-tight truncate">{user.nombre}</p>
                        <p className="text-white/60 text-xs mt-0.5 truncate">{user.rol}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xl">{user.icon}</span>
                      <span className="bg-black/25 text-white/80 text-xs font-medium px-2 py-0.5 rounded-full">
                        Nivel {user.nivel}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center pb-6 space-y-1">
        <p className="text-slate-600 text-xs">
          Login real disponible en{' '}
          <a href="/login-real" className="text-slate-500 hover:text-slate-400 underline underline-offset-2 transition-colors">
            /login-real
          </a>
        </p>
      </div>
    </div>
  )
}
