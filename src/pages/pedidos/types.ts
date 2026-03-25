export type EstadoNota =
  | 'capturada'
  | 'en_surtido'
  | 'surtido_parcial'
  | 'completa_en_piso'
  | 'lista_para_cobro'
  | 'cobrada'
  | 'checada_en_piso'
  | 'checada_en_salida'
  | 'cerrada'
  | 'cancelada'
  | 'con_incidencia'

export interface ItemNota {
  id: string
  producto_id?: string | null
  codigo: string
  nombre: string
  cantidad: number
  cantidad_surtida?: number | null
  estado_item?: string | null
  area?: string | null
  incidencia?: string | null
}

export interface Nota {
  id: string
  folio: string
  estado: EstadoNota
  nombre_cliente: string
  cliente_id?: string | null
  vendedora_id: string
  vendedora?: { nombre: string; numero_agente?: string | null }
  sucursal_id: string
  sucursales?: { nombre: string }
  notas?: string | null
  facturacion: boolean
  descuento_especial: boolean
  qr_code?: string | null
  created_at: string
  items: ItemNota[]
}

export const ESTADO_LABELS: Record<EstadoNota | string, { label: string; color: string; step: number }> = {
  capturada:           { label: 'Capturada',          color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',         step: 1 },
  en_surtido:          { label: 'En surtido',         color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400', step: 2 },
  surtido_parcial:     { label: 'Surtido parcial',    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400', step: 3 },
  completa_en_piso:    { label: 'Completa en piso',   color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',        step: 4 },
  lista_para_cobro:    { label: 'Lista para cobro',   color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400', step: 5 },
  cobrada:             { label: 'Cobrada',             color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400',         step: 6 },
  checada_en_piso:     { label: 'Checada en piso',    color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400',  step: 7 },
  checada_en_salida:   { label: 'Checada en salida',  color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400',  step: 8 },
  cerrada:             { label: 'Cerrada ✓',          color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',      step: 9 },
  cancelada:           { label: 'Cancelada',           color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',           step: 0 },
  con_incidencia:      { label: 'Con incidencia',      color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400',       step: 0 },
}

export const FLUJO_ESTADOS: EstadoNota[] = [
  'capturada', 'en_surtido', 'surtido_parcial', 'completa_en_piso',
  'lista_para_cobro', 'cobrada', 'checada_en_piso', 'checada_en_salida', 'cerrada',
]

// MOCK DATA
export const MOCK_NOTAS: Nota[] = [
  {
    id: 'n1', folio: 'PV-20260321-0042', estado: 'capturada',
    nombre_cliente: 'Refaccionaria El Pistón', vendedora_id: 'v1',
    vendedora: { nombre: 'Ana García', numero_agente: 'AGT-007' },
    sucursal_id: 's1', sucursales: { nombre: 'Norte' },
    notas: 'Cliente frecuente, trato preferencial', facturacion: true, descuento_especial: false,
    created_at: new Date().toISOString(),
    items: [
      { id: 'i1', producto_id: 'p1', codigo: 'ACT-001', nombre: 'Aceite Motor 5W-30 1L', cantidad: 5, cantidad_surtida: 0, estado_item: 'pendiente', area: 'A-3' },
      { id: 'i2', producto_id: 'p2', codigo: 'FLT-003', nombre: 'Filtro de Aceite Bosch', cantidad: 2, cantidad_surtida: 0, estado_item: 'pendiente', area: 'B-1' },
      { id: 'i3', producto_id: 'p3', codigo: 'BJA-010', nombre: 'Bujías NGK Set x4', cantidad: 1, cantidad_surtida: 0, estado_item: 'pendiente', area: 'C-2' },
    ],
  },
  {
    id: 'n2', folio: 'PV-20260321-0041', estado: 'completa_en_piso',
    nombre_cliente: 'Auto Parts Norte SA', vendedora_id: 'v1',
    vendedora: { nombre: 'Ana García', numero_agente: 'AGT-007' },
    sucursal_id: 's1', sucursales: { nombre: 'Norte' },
    notas: null, facturacion: false, descuento_especial: true,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    items: [
      { id: 'i4', producto_id: 'p4', codigo: 'FRN-007', nombre: 'Pastillas Freno Bosch', cantidad: 2, cantidad_surtida: 2, estado_item: 'surtido', area: 'D-5' },
      { id: 'i5', producto_id: 'p5', codigo: 'LQD-002', nombre: 'Líquido Frenos DOT4 500ml', cantidad: 3, cantidad_surtida: 3, estado_item: 'surtido', area: 'A-1' },
    ],
  },
  {
    id: 'n3', folio: 'PV-20260321-0040', estado: 'lista_para_cobro',
    nombre_cliente: 'Público en general', vendedora_id: 'v2',
    vendedora: { nombre: 'María López', numero_agente: 'AGT-012' },
    sucursal_id: 's1', sucursales: { nombre: 'Norte' },
    notas: 'Pago con tarjeta', facturacion: false, descuento_especial: false,
    qr_code: 'PV-20260321-0040',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    items: [
      { id: 'i6', producto_id: 'p6', codigo: 'CRR-015', nombre: 'Correa Distribución Gates', cantidad: 1, cantidad_surtida: 1, estado_item: 'surtido', area: 'E-2' },
      { id: 'i7', producto_id: 'p7', codigo: 'ACT-005', nombre: 'Aceite Transmisión ATF', cantidad: 2, cantidad_surtida: 2, estado_item: 'surtido', area: 'A-3' },
    ],
  },
  {
    id: 'n4', folio: 'PV-20260321-0039', estado: 'cobrada',
    nombre_cliente: 'Taller Mecánico Ramos', vendedora_id: 'v2',
    vendedora: { nombre: 'María López', numero_agente: 'AGT-012' },
    sucursal_id: 's1', sucursales: { nombre: 'Norte' },
    notas: null, facturacion: true, descuento_especial: false,
    qr_code: 'PV-20260321-0039',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    items: [
      { id: 'i8', producto_id: 'p8', codigo: 'KIT-020', nombre: 'Kit Clutch Completo', cantidad: 1, cantidad_surtida: 1, estado_item: 'surtido', area: 'F-1' },
    ],
  },
]
