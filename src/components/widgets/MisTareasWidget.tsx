import { CheckSquare, Circle } from 'lucide-react'
import { WidgetWrapper } from './WidgetWrapper'
import { useEffect, useState } from 'react'
import api from '../../services/api'

interface Tarea { id: string; titulo: string; estado: string; prioridad: string }

const MOCK: Tarea[] = [
  { id: '1', titulo: 'Revisar pedido #1041 (faltantes)',   estado: 'pendiente',    prioridad: 'alta'   },
  { id: '2', titulo: 'Actualizar precios temporada',       estado: 'en_progreso',  prioridad: 'media'  },
  { id: '3', titulo: 'Capacitación nuevo sistema',         estado: 'pendiente',    prioridad: 'baja'   },
]

const PRIORIDAD_COLOR: Record<string, string> = {
  alta:  'text-red-500',
  media: 'text-amber-500',
  baja:  'text-gray-400',
}

export function MisTareasWidget() {
  const [data, setData] = useState<Tarea[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/tareas/mis-tareas?limit=5')
      .then(r => setData(Array.isArray(r.data) ? r.data : MOCK))
      .catch(() => setData(MOCK))
      .finally(() => setLoading(false))
  }, [])

  return (
    <WidgetWrapper
      title="Mis Tareas"
      icon={<CheckSquare size={16} />}
      badge={data.filter(t => t.estado !== 'completada').length}
      accentColor="blue"
      loading={loading}
      footer={<button className="text-blue-500 hover:underline">Ver todas mis tareas →</button>}
    >
      {data.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">Sin tareas pendientes ✓</p>
      ) : (
        <div className="space-y-2">
          {data.map(t => (
            <div key={t.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <Circle size={14} className={PRIORIDAD_COLOR[t.prioridad] ?? 'text-gray-400'} />
              <span className="flex-1 text-xs text-gray-800 dark:text-gray-200 truncate">{t.titulo}</span>
              <span className={`text-[10px] font-medium ${t.estado === 'en_progreso' ? 'text-blue-500' : 'text-gray-400'}`}>
                {t.estado === 'en_progreso' ? 'En progreso' : 'Pendiente'}
              </span>
            </div>
          ))}
        </div>
      )}
    </WidgetWrapper>
  )
}
