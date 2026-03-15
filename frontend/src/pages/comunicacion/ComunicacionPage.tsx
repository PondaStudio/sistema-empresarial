import { useEffect, useRef, useState } from 'react'
import api from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

interface Canal {
  id: string
  nombre: string
  descripcion?: string
  tipo: string
}

interface Mensaje {
  id: string
  contenido?: string
  tipo: string
  url_archivo?: string
  created_at: string
  usuario: { nombre: string; foto_url?: string }
}

export default function ComunicacionPage() {
  const { user } = useAuthStore()
  const [canales, setCanales]     = useState<Canal[]>([])
  const [canal, setCanal]         = useState<Canal | null>(null)
  const [mensajes, setMensajes]   = useState<Mensaje[]>([])
  const [texto, setTexto]         = useState('')
  const [sending, setSending]     = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.get('/comunicacion/canales').then(r => {
      setCanales(r.data)
      if (r.data.length > 0) setCanal(r.data[0])
    })
  }, [])

  useEffect(() => {
    if (!canal) return
    api.get(`/comunicacion/canales/${canal.id}/mensajes`)
      .then(r => setMensajes(r.data))
  }, [canal])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  async function enviar() {
    if (!texto.trim() || !canal) return
    setSending(true)
    try {
      await api.post(`/comunicacion/canales/${canal.id}/mensajes`, { contenido: texto })
      setTexto('')
      const r = await api.get(`/comunicacion/canales/${canal.id}/mensajes`)
      setMensajes(r.data)
    } catch { toast.error('Error al enviar') }
    finally { setSending(false) }
  }

  async function subirArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !canal) return
    const fd = new FormData()
    fd.append('archivo', file)
    try {
      await api.post(`/comunicacion/canales/${canal.id}/mensajes`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const r = await api.get(`/comunicacion/canales/${canal.id}/mensajes`)
      setMensajes(r.data)
    } catch { toast.error('Error al subir archivo') }
  }

  return (
    <div className="flex h-full">
      {/* Panel de canales */}
      <div className="w-60 shrink-0 bg-gray-50 dark:bg-gray-900 border-r dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Canales</h2>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {canales.map(c => (
            <button key={c.id} onClick={() => setCanal(c)}
              className={`w-full text-left px-4 py-2.5 text-sm transition ${
                canal?.id === c.id
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}>
              # {c.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Panel de mensajes */}
      <div className="flex-1 flex flex-col min-w-0">
        {canal ? (
          <>
            <div className="px-5 py-3 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
              <p className="font-semibold text-gray-900 dark:text-white"># {canal.nombre}</p>
              {canal.descripcion && <p className="text-xs text-gray-400">{canal.descripcion}</p>}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white dark:bg-gray-800">
              {mensajes.map(m => (
                <div key={m.id} className={`flex gap-3 ${m.usuario?.nombre === user?.nombre ? 'flex-row-reverse' : ''}`}>
                  <div className="w-8 h-8 rounded-full bg-primary-200 dark:bg-primary-700 flex items-center justify-center text-xs font-bold text-primary-700 dark:text-primary-200 shrink-0">
                    {m.usuario?.nombre?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className={`max-w-xs lg:max-w-md ${m.usuario?.nombre === user?.nombre ? 'items-end' : 'items-start'} flex flex-col`}>
                    <p className="text-xs text-gray-400 mb-1">{m.usuario?.nombre}</p>
                    {m.tipo === 'texto' && m.contenido && (
                      <div className={`px-3 py-2 rounded-2xl text-sm ${
                        m.usuario?.nombre === user?.nombre
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}>
                        {m.contenido}
                      </div>
                    )}
                    {m.tipo === 'archivo' && m.url_archivo && (
                      <a href={m.url_archivo} target="_blank" rel="noopener noreferrer"
                        className="px-3 py-2 rounded-2xl bg-gray-100 dark:bg-gray-700 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                        📎 Archivo adjunto
                      </a>
                    )}
                    {m.tipo === 'voz' && m.url_archivo && (
                      <audio controls src={m.url_archivo} className="max-w-xs" />
                    )}
                    <p className="text-[10px] text-gray-400 mt-1">
                      {new Date(m.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input de mensaje */}
            <div className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex gap-2">
                <label className="cursor-pointer p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  📎
                  <input type="file" className="hidden" onChange={subirArchivo} />
                </label>
                <input
                  value={texto}
                  onChange={e => setTexto(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), enviar())}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 px-3 py-2 border rounded-xl text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:border-primary-400"
                />
                <button onClick={enviar} disabled={sending || !texto.trim()}
                  className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm hover:bg-primary-700 disabled:opacity-50">
                  Enviar
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Selecciona un canal para comenzar
          </div>
        )}
      </div>
    </div>
  )
}
