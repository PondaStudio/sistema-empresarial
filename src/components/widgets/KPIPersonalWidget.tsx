import { Target } from 'lucide-react'
import { WidgetWrapper } from './WidgetWrapper'
import { useState } from 'react'

interface KPIPersonal { ventas_hoy: number; meta_dia: number; ventas_mes: number; meta_mes: number }

const MOCK: KPIPersonal = { ventas_hoy: 8400, meta_dia: 12000, ventas_mes: 68200, meta_mes: 90000 }

export function KPIPersonalWidget() {
  const [data] = useState<KPIPersonal>(MOCK)
  const [loading] = useState(false)


  const pctDia = Math.min(Math.round((data.ventas_hoy / data.meta_dia) * 100), 100)
  const pctMes = Math.min(Math.round((data.ventas_mes / data.meta_mes) * 100), 100)

  return (
    <WidgetWrapper
      title="Mi Desempeño"
      icon={<Target size={16} />}
      accentColor="gold"
      loading={loading}
    >
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500 dark:text-gray-400">Meta del día</span>
            <span className="font-semibold text-gray-900 dark:text-white">{pctDia}%</span>
          </div>
          <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${pctDia >= 100 ? 'bg-green-500' : pctDia >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${pctDia}%` }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1 text-gray-400">
            <span>${data.ventas_hoy.toLocaleString('es-MX')}</span>
            <span>Meta: ${data.meta_dia.toLocaleString('es-MX')}</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500 dark:text-gray-400">Meta del mes</span>
            <span className="font-semibold text-gray-900 dark:text-white">{pctMes}%</span>
          </div>
          <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${pctMes >= 100 ? 'bg-green-500' : pctMes >= 70 ? 'bg-blue-500' : 'bg-amber-500'}`}
              style={{ width: `${pctMes}%` }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1 text-gray-400">
            <span>${data.ventas_mes.toLocaleString('es-MX')}</span>
            <span>Meta: ${data.meta_mes.toLocaleString('es-MX')}</span>
          </div>
        </div>
      </div>
    </WidgetWrapper>
  )
}
