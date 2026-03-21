import { AlertCircle } from 'lucide-react'
import { WidgetWrapper } from './WidgetWrapper'
import { useState } from 'react'

interface Advertencia { mensaje: string; tipo: 'info' | 'warning' | 'error'; fecha: string }

const MOCK: Advertencia[] = [
  { mensaje: 'Recuerda registrar el cierre de caja antes de las 6pm',  tipo: 'info',    fecha: 'Hoy' },
  { mensaje: 'El pedido #1038 tiene 2 días sin surtir',                tipo: 'warning', fecha: 'Hace 2 días' },
]

const TIPO_STYLE = {
  info:    'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
  warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
  error:   'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
}

export function AdvertenciasWidget() {
  const [data] = useState<Advertencia[]>(MOCK)

  return (
    <WidgetWrapper
      title="Avisos y Advertencias"
      icon={<AlertCircle size={16} />}
      badge={data.length}
      accentColor="red"
      footer={<button className="text-blue-500 hover:underline">Ver todos los avisos →</button>}
    >
      {data.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">Sin avisos pendientes ✓</p>
      ) : (
        <div className="space-y-2">
          {data.map((a, i) => (
            <div key={i} className={`p-3 rounded-lg border text-xs ${TIPO_STYLE[a.tipo]}`}>
              <p>{a.mensaje}</p>
              <p className="mt-1 opacity-60">{a.fecha}</p>
            </div>
          ))}
        </div>
      )}
    </WidgetWrapper>
  )
}
