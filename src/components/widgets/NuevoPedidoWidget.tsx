import { ShoppingCart, Plus } from 'lucide-react'
import { WidgetWrapper } from './WidgetWrapper'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export function NuevoPedidoWidget() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)

  return (
    <WidgetWrapper
      title="Nuevo Pedido"
      icon={<ShoppingCart size={16} />}
      accentColor="blue"
    >
      <div className="flex flex-col items-center justify-center py-4 gap-4">
        <button
          onClick={() => navigate('/pedidos/venta')}
          className="w-full bg-gradient-to-br from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white rounded-2xl p-6 flex flex-col items-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
        >
          <Plus size={36} strokeWidth={2.5} />
          <span className="text-lg font-bold tracking-wide">NUEVO PEDIDO</span>
          <span className="text-xs text-blue-200">Registrar venta</span>
        </button>
        <p className="text-xs text-gray-400">
          Hola, <span className="font-medium text-gray-600 dark:text-gray-300">{user?.nombre ?? 'Vendedora'}</span> — ¡listo para vender hoy!
        </p>
      </div>
    </WidgetWrapper>
  )
}
