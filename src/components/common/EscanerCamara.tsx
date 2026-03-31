import { useEffect, useRef } from 'react'
import { X, Camera } from 'lucide-react'

interface Props {
  /** 'qr' para notas, 'barcode' para productos */
  modo: 'qr' | 'barcode'
  onScan: (resultado: string) => void
  onClose: () => void
}

const ELEM_ID = 'escaner-camara-preview'

function extraerFolio(text: string): string {
  const match = text.match(/\/pedidos\/folio\/([^/?#\s]+)/)
  if (match) return match[1]
  return text.trim()
}

export function EscanerCamara({ modo, onScan, onClose }: Props) {
  const scannedRef = useRef(false)
  const scannerRef = useRef<any>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    async function iniciar() {
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode')
        if (!mountedRef.current) return

        const formatos = modo === 'qr'
          ? [Html5QrcodeSupportedFormats.QR_CODE]
          : [
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.CODE_39,
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E,
              Html5QrcodeSupportedFormats.DATA_MATRIX,
            ]

        const scanner = new Html5Qrcode(ELEM_ID, { formatsToSupport: formatos, verbose: false })
        scannerRef.current = scanner

        const qrbox = modo === 'qr'
          ? { width: 250, height: 250 }
          : { width: 280, height: 100 }

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 12, qrbox },
          (decoded: string) => {
            if (scannedRef.current) return
            scannedRef.current = true
            const resultado = modo === 'qr' ? extraerFolio(decoded) : decoded.trim()
            scanner.stop().catch(() => {}).finally(() => {
              if (mountedRef.current) onScan(resultado)
            })
          },
          () => {} // errores de frame: ignorar
        )
      } catch (err) {
        console.error('[EscanerCamara] error al iniciar cámara:', err)
      }
    }

    iniciar()

    return () => {
      mountedRef.current = false
      const sc = scannerRef.current
      if (sc) {
        sc.stop().catch(() => {}).finally(() => {
          try { sc.clear() } catch {}
        })
        scannerRef.current = null
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 z-[70] bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Camera size={16} className="text-blue-500" />
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
              {modo === 'qr' ? 'Escanear código QR' : 'Escanear código de barras'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Visor de cámara — html5-qrcode inyecta el video aquí */}
        <div className="relative bg-black">
          <div id={ELEM_ID} className="w-full" />
        </div>

        {/* Footer */}
        <div className="px-4 py-3 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {modo === 'qr'
              ? 'Apunta la cámara trasera al código QR del ticket'
              : 'Apunta la cámara al código de barras del producto'}
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
