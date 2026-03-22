interface Props {
  folio: string
  size?: number
}

export function QRCodeDisplay({ folio, size = 160 }: Props) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(folio)}&size=${size}x${size}&margin=2`
  return (
    <div className="flex flex-col items-center gap-1">
      <img src={url} alt={`QR ${folio}`} width={size} height={size} className="rounded-lg border border-gray-200 dark:border-gray-700" />
      <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{folio}</span>
    </div>
  )
}
