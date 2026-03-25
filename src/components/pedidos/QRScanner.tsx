import { useEffect, useRef } from 'react'
import { X, Camera } from 'lucide-react'

interface Props {
  onScan: (folio: string) => void
  onClose: () => void
}

const QR_READER_ID = 'qr-reader-camara'

function extraerFolio(text: string): string {
  // Si es URL tipo /pedidos/folio/FOLIO-XXX extrae el folio
  const match = text.match(/\/pedidos\/folio\/([^/?#\s]+)/)
  if (match) return match[1]
  // Si es un folio directo (letras, números, guiones)
  return text.trim()
}

export function QRScanner({ onScan, onClose }: Props) {
  const scannerRef = useRef<any>(null)
  const scannedRef = useRef(false)

  useEffect(() => {
    let scanner: any = null

    async function startScanner() {
      try {
        // Importación dinámica para evitar SSR issues
        const { Html5Qrcode } = await import('html5-qrcode')
        scanner = new Html5Qrcode(QR_READER_ID)
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decoded: string) => {
            if (scannedRef.current) return
            scannedRef.current = true
            const folio = extraerFolio(decoded)
            // Detener antes de notificar
            scanner.stop().catch(() => {}).finally(() => {
              onScan(folio)
            })
          },
          () => {} // errores de frame, ignorar
        )
      } catch (err) {
        console.error('[QRScanner] error al iniciar cámara:', err)
      }
    }

    startScanner()

    return () => {
      if (scanner) {
        scanner.stop().catch(() => {}).finally(() => {
          try { scanner.clear() } catch {}
        })
      }
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex flex-col items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Camera size={16} className="text-blue-500" />
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Escanear código QR</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Visor de cámara */}
        <div className="relative bg-black">
          <div id={QR_READER_ID} className="w-full" />
        </div>

        {/* Footer */}
        <div className="px-4 py-3 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Apunta la cámara trasera al código QR del ticket
          </p>
          <button
            onClick={onClose}
            className="mt-2 text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
