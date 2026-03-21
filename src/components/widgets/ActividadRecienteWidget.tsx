import { Activity } from 'lucide-react'
import { WidgetWrapper } from './WidgetWrapper'
import { useState } from 'react'

interface Evento { usuario: string; accion: string; modulo: string; hace: string }

const MOCK: Evento[] = [
  { usuario: 'Ana García',    accion: 'Creó pedido #1042',       modulo: 'Pedidos',    hace: '2 min' },
  { usuario: 'Luis Martínez', accion: 'Actualizó stock',         modulo: 'Inventario', hace: '8 min' },
  { usuario: 'María López',   accion: 'Registró cobro $2,400',   modulo: 'Caja',       hace: '15 min' },
  { usuario: 'Carlos Ruiz',   accion: 'Asignó tarea a Almacén',  modulo: 'Tareas',     hace: '23 min' },
  { usuario: 'Diana Torres',  accion: 'Actualizó cliente #87',   modulo: 'Clientes',   hace: '31 min' },
]

const MODULE_COLORS: Record<string, string> = {
  Pedidos: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  Inventario: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  Caja: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  Tareas: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
  Clientes: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400',
}

export function ActividadRecienteWidget() {
  const [data] = useState<Evento[]>(MOCK)
  const [loading] = useState(false)

  return (
    <WidgetWrapper
      title="Actividad Reciente"
      icon={<Activity size={16} />}
      accentColor="gray"
      loading={loading}
      footer={<button className="text-blue-500 hover:underline">Ver bitácora completa →</button>}
    >
      <div className="space-y-2">
        {data.map((e, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-7 h-7 shrink-0 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
              {e.usuario[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-900 dark:text-white">
                <span className="font-medium">{e.usuario}</span> · {e.accion}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${MODULE_COLORS[e.modulo] ?? 'bg-gray-100 text-gray-600'}`}>
                  {e.modulo}
                </span>
                <span className="text-[10px] text-gray-400">{e.hace}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </WidgetWrapper>
  )
}
