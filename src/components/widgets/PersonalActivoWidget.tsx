import { Users } from 'lucide-react'
import { WidgetWrapper } from './WidgetWrapper'
import { useState } from 'react'

interface Empleado { nombre: string; rol: string; estado: 'disponible' | 'ocupado' | 'ausente' }

const MOCK: Empleado[] = [
  { nombre: 'Ana García',    rol: 'Vendedora',    estado: 'disponible' },
  { nombre: 'Luis Martínez', rol: 'Almacenista',  estado: 'ocupado'    },
  { nombre: 'María López',   rol: 'Cajera',       estado: 'disponible' },
  { nombre: 'Jorge Reyes',   rol: 'Almacenista',  estado: 'ausente'    },
  { nombre: 'Rosa Sánchez',  rol: 'Vendedora',    estado: 'ocupado'    },
]

const ESTADO_DOT = {
  disponible: 'bg-green-500',
  ocupado:    'bg-red-500',
  ausente:    'bg-gray-400',
}

export function PersonalActivoWidget() {
  const [data] = useState<Empleado[]>(MOCK)
  const activos = data.filter(e => e.estado !== 'ausente').length

  return (
    <WidgetWrapper
      title="Personal Activo"
      icon={<Users size={16} />}
      badge={`${activos}/${data.length}`}
      accentColor="blue"
      footer={<span>{activos} presentes · {data.filter(e => e.estado === 'ausente').length} ausentes</span>}
    >
      <div className="space-y-2">
        {data.map((e, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div className={`w-2 h-2 rounded-full shrink-0 ${ESTADO_DOT[e.estado]}`} />
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-xs text-white font-bold">
              {e.nombre[0]}
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-900 dark:text-white">{e.nombre}</p>
              <p className="text-[10px] text-gray-400">{e.rol}</p>
            </div>
            <span className={`text-[10px] font-medium capitalize ${e.estado === 'disponible' ? 'text-green-500' : e.estado === 'ocupado' ? 'text-red-500' : 'text-gray-400'}`}>
              {e.estado}
            </span>
          </div>
        ))}
      </div>
    </WidgetWrapper>
  )
}
