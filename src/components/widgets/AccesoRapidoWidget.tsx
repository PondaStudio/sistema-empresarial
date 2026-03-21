import { Users, Shield, FileText, MessageSquare, Package, Zap } from 'lucide-react'
import { WidgetWrapper } from './WidgetWrapper'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

const LINKS_ADMIN = [
  { label: 'Usuarios',   icon: <Users size={18} />,        path: '/usuarios',     color: 'bg-blue-600 hover:bg-blue-700' },
  { label: 'Permisos',   icon: <Shield size={18} />,       path: '/permisos',     color: 'bg-indigo-600 hover:bg-indigo-700' },
  { label: 'Reportes',   icon: <FileText size={18} />,     path: '/reportes',     color: 'bg-green-600 hover:bg-green-700' },
  { label: 'Comunicación', icon: <MessageSquare size={18} />, path: '/comunicacion', color: 'bg-purple-600 hover:bg-purple-700' },
]

const LINKS_VENDEDORA = [
  { label: 'Comunicación', icon: <MessageSquare size={18} />, path: '/comunicacion', color: 'bg-purple-600 hover:bg-purple-700' },
  { label: 'Inventario',   icon: <Package size={18} />,       path: '/inventario',   color: 'bg-amber-600 hover:bg-amber-700' },
]

export function AccesoRapidoWidget() {
  const navigate = useNavigate()
  const nivel = useAuthStore(s => s.user?.roles?.nivel ?? 99)
  const links = nivel <= 3 ? LINKS_ADMIN : LINKS_VENDEDORA

  return (
    <WidgetWrapper
      title="Acceso Rápido"
      icon={<Zap size={16} />}
      accentColor="gold"
    >
      <div className="grid grid-cols-2 gap-2">
        {links.map(l => (
          <button
            key={l.path}
            onClick={() => navigate(l.path)}
            className={`${l.color} text-white rounded-xl p-3 flex flex-col items-center gap-1.5 transition-colors`}
          >
            {l.icon}
            <span className="text-xs font-medium">{l.label}</span>
          </button>
        ))}
      </div>
    </WidgetWrapper>
  )
}
