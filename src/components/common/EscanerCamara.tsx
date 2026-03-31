import { useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

interface Props {
  onScan: (resultado: string) => void
  onClose: () => void
  modo: 'barcode' | 'qr'
}

export default function EscanerCamara({ onScan, onClose, modo }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const divIdRef = useRef('qr-reader-' + Math.random().toString(36).slice(2))
  const divId = divIdRef.current

  useEffect(() => {
    const formatos = modo === 'qr'
      ? [0] // QR_CODE = 0
      : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] // todos los barcodes

    const scanner = new Html5Qrcode(divId, { formatsToSupport: formatos, verbose: false })
    scannerRef.current = scanner

    scanner.start(
      { facingMode: 'environment' },
      {
        fps: 10,
        qrbox: modo === 'qr' ? { width: 250, height: 250 } : { width: 300, height: 150 },
      },
      (decodedText) => {
        onScan(decodedText)
        scanner.stop().catch(() => {})
      },
      () => {} // error silencioso en cada frame
    ).catch((err) => {
      console.error('Scanner error:', err)
    })

    return () => {
      scanner.stop().catch(() => {})
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-xl p-4 w-full max-w-sm">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">
            {modo === 'qr' ? '📷 Escanear QR' : '📷 Escanear código'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
        </div>
        <div id={divId} className="w-full rounded overflow-hidden" />
        <p className="text-xs text-gray-500 text-center mt-2">
          Apunta la cámara al {modo === 'qr' ? 'código QR' : 'código de barras'}
        </p>
      </div>
    </div>
  )
}
