import { Receipt } from 'lucide-react'
import { WidgetWrapper } from './WidgetWrapper'
import { useState } from 'react'

interface Transaccion { id: string; concepto: string; monto: number; hora: string; tipo: 'cobro' | 'devolucion' }

const MOCK: Transaccion[] = [
  { id: 'T-0892', concepto: 'Cobro pedido #1041', monto: 1850, hora: '11:45 AM', tipo: 'cobro' },
  { id: 'T-0891', concepto: 'Cobro pedido #1039', monto: 4200, hora: '10:30 AM', tipo: 'cobro' },
  { id: 'T-0890', concepto: 'Devolución parcial',  monto: 350,  hora: '09:15 AM', tipo: 'devolucion' },
  { id: 'T-0889', concepto: 'Cobro pedido #1037', monto: 2100, hora: 'Ayer',      tipo: 'cobro' },
]

export function UltimasTransaccionesWidget() {
  const [data] = useState<Transaccion[]>(MOCK)
  const totalDia = data.filter(t => t.tipo === 'cobro' && !t.hora.startsWith('Ayer')).reduce((s, t) => s + t.monto, 0)

  return (
    <WidgetWrapper
      title="Últimas Transacciones"
      icon={<Receipt size={16} />}
      accentColor="green"
      footer={<span>Total cobrado hoy: <span className="font-bold text-green-600">${totalDia.toLocaleString('es-MX')}</span></span>}
    >
      <div className="space-y-1.5">
        {data.map(t => (
          <div key={t.id} className="flex items-center gap-3 py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
            <div className={`w-2 h-2 rounded-full shrink-0 ${t.tipo === 'cobro' ? 'bg-green-500' : 'bg-red-500'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-800 dark:text-gray-200 truncate">{t.concepto}</p>
              <p className="text-[10px] text-gray-400">{t.id} · {t.hora}</p>
            </div>
            <span className={`text-xs font-bold shrink-0 ${t.tipo === 'cobro' ? 'text-green-600' : 'text-red-500'}`}>
              {t.tipo === 'devolucion' ? '-' : '+'}${t.monto.toLocaleString('es-MX')}
            </span>
          </div>
        ))}
      </div>
    </WidgetWrapper>
  )
}
