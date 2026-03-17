import { useEffect, useRef, useState } from 'react'
import api from '../../services/api'

interface Notificacion {
  id: string
  tipo: string
  titulo: string
  cuerpo?: string
  leida: boolean
  url?: string
  created_at: string
}

export function NotificationBell() {
  const [count, setCount]       = useState(0)
  const [open, setOpen]         = useState(false)
  const [notifs, setNotifs]     = useState<Notificacion[]>([])
  const ref = useRef<HTMLDivElement>(null)

  const loadCount = () => api.get('/notificaciones/unread-count').then(r => setCount(r.data.count)).catch(() => {})
  const loadNotifs = () => api.get('/notificaciones').then(r => setNotifs(r.data)).catch(() => {})

  useEffect(() => {
    loadCount()
    const interval = setInterval(loadCount, 30_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!open) return
    loadNotifs()
  }, [open])

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function marcarLeida(id: string) {
    await api.patch(`/notificaciones/${id}/leer`)
    setNotifs(n => n.map(x => x.id === id ? { ...x, leida: true } : x))
    setCount(c => Math.max(0, c - 1))
  }

  async function marcarTodas() {
    await api.patch('/notificaciones/leer-todas')
    setNotifs(n => n.map(x => ({ ...x, leida: true })))
    setCount(0)
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
        🔔
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Notificaciones</p>
            {count > 0 && (
              <button onClick={marcarTodas} className="text-xs text-primary-600 hover:underline">
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y dark:divide-gray-700">
            {notifs.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Sin notificaciones</p>
            ) : (
              notifs.map(n => (
                <div key={n.id}
                  onClick={() => { if (!n.leida) marcarLeida(n.id) }}
                  className={`px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition ${
                    !n.leida ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''
                  }`}>
                  <div className="flex items-start gap-2">
                    {!n.leida && <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-1.5 shrink-0" />}
                    <div className={!n.leida ? '' : 'ml-3.5'}>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{n.titulo}</p>
                      {n.cuerpo && <p className="text-xs text-gray-500 mt-0.5">{n.cuerpo}</p>}
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(n.created_at).toLocaleString('es-MX')}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
