import { useState, useCallback } from 'react'
import { useAuthStore } from '../../store/authStore'
import { getLayoutForNivel, WidgetConfig, WidgetId } from '../../config/dashboardLayouts'
import { KPIsGlobalesWidget } from '../../components/widgets/KPIsGlobalesWidget'
import { VentasSucursalWidget } from '../../components/widgets/VentasSucursalWidget'
import { AlertasInventarioWidget } from '../../components/widgets/AlertasInventarioWidget'
import { ActividadRecienteWidget } from '../../components/widgets/ActividadRecienteWidget'
import { AccesoRapidoWidget } from '../../components/widgets/AccesoRapidoWidget'
import { NuevoPedidoWidget } from '../../components/widgets/NuevoPedidoWidget'
import { MisTareasWidget } from '../../components/widgets/MisTareasWidget'
import { MisPedidosHoyWidget } from '../../components/widgets/MisPedidosHoyWidget'
import { KPIPersonalWidget } from '../../components/widgets/KPIPersonalWidget'
import { AdvertenciasWidget } from '../../components/widgets/AdvertenciasWidget'
import { ColaPedidosWidget } from '../../components/widgets/ColaPedidosWidget'
import { PedidosParaCobrarWidget } from '../../components/widgets/PedidosParaCobrarWidget'
import { UltimasTransaccionesWidget } from '../../components/widgets/UltimasTransaccionesWidget'
import { KPISucursalWidget } from '../../components/widgets/KPISucursalWidget'
import { PersonalActivoWidget } from '../../components/widgets/PersonalActivoWidget'

const WIDGET_MAP: Record<WidgetId, () => JSX.Element> = {
  kpis_globales:         () => <KPIsGlobalesWidget />,
  ventas_sucursal:       () => <VentasSucursalWidget />,
  alertas_inventario:    () => <AlertasInventarioWidget />,
  actividad_reciente:    () => <ActividadRecienteWidget />,
  acceso_rapido_admin:   () => <AccesoRapidoWidget />,
  nuevo_pedido:          () => <NuevoPedidoWidget />,
  mis_tareas:            () => <MisTareasWidget />,
  mis_pedidos_hoy:       () => <MisPedidosHoyWidget />,
  kpi_personal:          () => <KPIPersonalWidget />,
  advertencias:          () => <AdvertenciasWidget />,
  cola_pedidos:          () => <ColaPedidosWidget />,
  pedidos_para_cobrar:   () => <PedidosParaCobrarWidget />,
  ultimas_transacciones: () => <UltimasTransaccionesWidget />,
  kpi_sucursal:          () => <KPISucursalWidget />,
  personal_activo:       () => <PersonalActivoWidget />,
}

const COL_SPAN_CLASS: Record<number, string> = {
  1: 'col-span-1',
  2: 'col-span-1 md:col-span-2',
  3: 'col-span-1 md:col-span-3',
  4: 'col-span-1 md:col-span-4',
}

export default function DashboardPage() {
  const user = useAuthStore(s => s.user)
  const nivel = user?.roles?.nivel ?? 99
  const [layout, setLayout] = useState<WidgetConfig[]>(() => getLayoutForNivel(nivel))
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  const handleDragStart = useCallback((i: number) => setDragIdx(i), [])
  const handleDrop = useCallback((targetIdx: number) => {
    if (dragIdx === null || dragIdx === targetIdx) return
    setLayout(prev => {
      const next = [...prev]
      const [moved] = next.splice(dragIdx, 1)
      next.splice(targetIdx, 0, moved)
      return next
    })
    setDragIdx(null)
  }, [dragIdx])

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Hola, {user?.nombre?.split(' ')[0] ?? 'Usuario'} 👋
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {user?.roles?.nombre} · {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-auto">
        {layout.map((w, i) => {
          const Component = WIDGET_MAP[w.id]
          if (!Component) return null
          return (
            <div
              key={w.id}
              className={`${COL_SPAN_CLASS[w.colSpan]} min-h-[220px] ${dragIdx === i ? 'opacity-50 scale-95' : ''} transition-all`}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleDrop(i)}
            >
              <Component />
            </div>
          )
        })}
      </div>
    </div>
  )
}
