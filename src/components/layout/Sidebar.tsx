import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

interface NavItem {
  path: string
  label: string
  icon: string
  modulo: string
}

const NAV: NavItem[] = [
  { path: '/dashboard',      label: 'Dashboard',     icon: '📊', modulo: 'dashboard' },
  { path: '/pedidos',        label: 'Ventas',         icon: '🛒', modulo: 'pedidos_venta' },
  { path: '/clientes',       label: 'Clientes',       icon: '🧑‍💼', modulo: 'clientes' },
  { path: '/inventario',     label: 'Inventario',     icon: '📦', modulo: 'inventario' },
  { path: '/proveedores',    label: 'Proveedores',    icon: '🏭', modulo: 'proveedores' },
  { path: '/tareas',         label: 'Tareas',         icon: '✅', modulo: 'tareas' },
  { path: '/comunicacion',   label: 'Comunicación',   icon: '💬', modulo: 'comunicacion' },
  { path: '/avisos',         label: 'Avisos',         icon: '📢', modulo: 'avisos' },
  { path: '/rrhh',           label: 'RRHH',           icon: '👥', modulo: 'rrhh' },
  { path: '/bitacora',       label: 'Bitácora',       icon: '📋', modulo: 'bitacora' },
  { path: '/capacitaciones', label: 'Capacitaciones', icon: '🎓', modulo: 'capacitaciones' },
  { path: '/evaluaciones',   label: 'Evaluaciones',   icon: '⭐', modulo: 'evaluaciones' },
  { path: '/formatos',       label: 'Formatos',       icon: '📂', modulo: 'formatos' },
]

const ADMIN_NAV: NavItem[] = [
  { path: '/admin/usuarios', label: 'Usuarios',  icon: '👤', modulo: 'usuarios' },
  { path: '/admin/permisos', label: 'Permisos',  icon: '🔑', modulo: 'permisos' },
]

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const { user, can } = useAuthStore()
  const isCreador = user?.roles?.nivel === 1

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition min-h-[44px] ${
      isActive
        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
    }`

  return (
    <aside className="w-60 shrink-0 bg-white dark:bg-gray-900 border-r dark:border-gray-700 flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-4 border-b dark:border-gray-700">
        <p className="text-lg font-bold text-primary-600">Sistema Empresarial</p>
        <p className="text-xs text-gray-400 truncate">{user?.nombre}</p>
      </div>

      {/* Navegación principal */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
        {NAV.filter(item => can(item.modulo, 'VER')).map(item => (
          <NavLink key={item.path} to={item.path} onClick={onClose} className={linkClass}>
            <span className="w-5 text-center">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        {ADMIN_NAV.some(item => can(item.modulo, 'VER')) && (
          <>
            <div className="px-3 pt-4 pb-1">
              <p className="text-[10px] uppercase tracking-wider text-gray-400">Administración</p>
            </div>
            {ADMIN_NAV.filter(item => can(item.modulo, 'VER')).map(item => (
              <NavLink key={item.path} to={item.path} onClick={onClose} className={linkClass}>
                <span className="w-5 text-center">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
            {isCreador && (
              <NavLink to="/admin/permisos" onClick={onClose} className={linkClass}>
                <span className="w-5 text-center">🛡️</span>
                Permisos Granulares
              </NavLink>
            )}
          </>
        )}
      </nav>

      {/* Footer del sidebar */}
      <div className="p-3 border-t dark:border-gray-700">
        <NavLink to="/perfil" onClick={onClose} className={linkClass}>
          <span className="w-5 text-center">⚙️</span>
          Mi perfil
        </NavLink>
      </div>
    </aside>
  )
}
