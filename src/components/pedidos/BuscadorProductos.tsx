import { useEffect, useRef, useState } from 'react'
import { Search, X, ScanLine } from 'lucide-react'
import api from '../../services/api'
import EscanerCamara from '../common/EscanerCamara'

interface Producto { id: string; codigo: string; nombre: string }
export interface ItemAgregado { codigo: string; nombre: string; cantidad: number; producto_id?: string }

interface Props {
  onClose: () => void
  onAdd: (item: ItemAgregado) => void
}

const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'

export function BuscadorProductos({ onClose, onAdd }: Props) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<Producto[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Producto | null>(null)
  const [cantidad, setCantidad] = useState(1)
  const [manualMode, setManualMode] = useState(false)
  const [manualCodigo, setManualCodigo] = useState('')
  const [manualNombre, setManualNombre] = useState('')
  const [showEscaner, setShowEscaner] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()
  const inputRef = useRef<HTMLInputElement>(null)
  const cantidadRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (selected) {
      setTimeout(() => {
        cantidadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        cantidadRef.current?.focus()
      }, 300)
    }
  }, [selected])

  useEffect(() => {
    clearTimeout(timerRef.current)
    const term = search.trim()
    if (!term) { setResults([]); setLoading(false); return }
    setLoading(true)
    timerRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get(`/productos?search=${encodeURIComponent(term)}`)
        setResults(Array.isArray(data) ? data : [])
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timerRef.current)
  }, [search])

  function handleAdd() {
    const cant = Math.max(1, cantidad)
    if (manualMode) {
      const cod = manualCodigo.trim().toUpperCase()
      if (!cod) return
      onAdd({ codigo: cod, nombre: manualNombre.trim() || cod, cantidad: cant })
    } else {
      if (!selected) return
      onAdd({ codigo: selected.codigo, nombre: selected.nombre, cantidad: cant, producto_id: selected.id })
    }
    onClose()
  }

  async function handleScan(codigo: string) {
    setShowEscaner(false)
    const term = codigo.trim().toUpperCase()
    setSearch(term)
    setSelected(null)
    setManualMode(false)
    setLoading(true)
    try {
      const { data } = await api.get(`/productos?search=${encodeURIComponent(term)}`)
      const lista: Producto[] = Array.isArray(data) ? data : []
      setResults(lista)
      // Si hay coincidencia exacta de código, seleccionarla directamente
      const exacto = lista.find(p => p.codigo.toUpperCase() === term)
      if (exacto) setSelected(exacto)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const showFooter = selected !== null || manualMode

  return (
    <>
    {showEscaner && <EscanerCamara modo="barcode" onScan={handleScan} onClose={() => setShowEscaner(false)} />}
    <div className="fixed inset-0 z-[60] flex flex-col md:items-center md:justify-center bg-black/60 backdrop-blur-sm md:p-4">
      <div className="bg-white dark:bg-gray-800 flex flex-col flex-1 md:flex-none md:rounded-2xl shadow-2xl w-full md:max-w-lg md:max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Agregar producto</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X size={20} />
          </button>
        </div>

        {/* Search input */}
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
          <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={inputRef}
              autoFocus
              className="w-full pl-9 pr-3 py-3 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Buscar por código o descripción..."
              value={search}
              onChange={e => { setSearch(e.target.value); setSelected(null); setManualMode(false) }}
              onFocus={() => inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            />
            {loading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowEscaner(true)}
            title="Escanear código de barras"
            className="flex-shrink-0 flex items-center justify-center w-12 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-colors"
          >
            <ScanLine size={18} />
          </button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {!loading && results.length > 0 && (
            <ul>
              {results.map(p => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => { setSelected(p); setManualMode(false) }}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 transition-colors ${
                      selected?.id === p.id
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400 w-28 flex-shrink-0 truncate">{p.codigo}</span>
                    <span className="text-sm text-gray-800 dark:text-white">{p.nombre}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!loading && search.trim() && results.length === 0 && !manualMode && (
            <div className="p-6 text-center space-y-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">No encontrado</p>
              <button
                type="button"
                onClick={() => { setManualMode(true); setManualCodigo(search.trim().toUpperCase()) }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Añadirlo manualmente
              </button>
            </div>
          )}

          {manualMode && (
            <div className="p-4 space-y-3">
              <input
                className={inputCls}
                placeholder="Código"
                value={manualCodigo}
                onChange={e => setManualCodigo(e.target.value.toUpperCase())}
              />
              <input
                className={inputCls}
                placeholder="Descripción"
                value={manualNombre}
                onChange={e => setManualNombre(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Footer: cantidad + añadir */}
        {showFooter && (
          <div className="sticky bottom-0 px-4 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center gap-3 flex-shrink-0 bg-white dark:bg-gray-800">
            <div className="flex-1 min-w-0">
              {selected && (
                <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                  <span className="font-mono font-bold">{selected.codigo}</span>{' '}
                  <span className="text-gray-500 dark:text-gray-400">{selected.nombre}</span>
                </p>
              )}
              {manualMode && <p className="text-xs font-mono text-gray-600 dark:text-gray-300">{manualCodigo || '—'}</p>}
            </div>
            <input
              ref={cantidadRef}
              type="number"
              min={1}
              value={cantidad}
              onFocus={e => e.target.select()}
              onChange={e => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 px-2 py-2 text-sm text-center border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleAdd}
              className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Añadir
            </button>
          </div>
        )}
      </div>
    </div>
    </>
  )
}
