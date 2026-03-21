export type WidgetId =
  | 'kpis_globales'
  | 'ventas_sucursal'
  | 'alertas_inventario'
  | 'actividad_reciente'
  | 'acceso_rapido_admin'
  | 'nuevo_pedido'
  | 'mis_tareas'
  | 'mis_pedidos_hoy'
  | 'kpi_personal'
  | 'advertencias'
  | 'cola_pedidos'
  | 'pedidos_para_cobrar'
  | 'ultimas_transacciones'
  | 'kpi_sucursal'
  | 'personal_activo'

export interface WidgetConfig {
  id: WidgetId
  /** 1–4 columns in a 4-col grid */
  colSpan: 1 | 2 | 3 | 4
}

const LAYOUT_ADMIN: WidgetConfig[] = [
  { id: 'kpis_globales',        colSpan: 4 },
  { id: 'ventas_sucursal',      colSpan: 2 },
  { id: 'alertas_inventario',   colSpan: 2 },
  { id: 'actividad_reciente',   colSpan: 2 },
  { id: 'acceso_rapido_admin',  colSpan: 2 },
]

const LAYOUT_ENCARGADO: WidgetConfig[] = [
  { id: 'kpi_sucursal',         colSpan: 4 },
  { id: 'personal_activo',      colSpan: 2 },
  { id: 'cola_pedidos',         colSpan: 2 },
  { id: 'alertas_inventario',   colSpan: 2 },
  { id: 'mis_tareas',           colSpan: 2 },
]

const LAYOUT_VENDEDORA: WidgetConfig[] = [
  { id: 'nuevo_pedido',         colSpan: 2 },
  { id: 'kpi_personal',         colSpan: 2 },
  { id: 'mis_pedidos_hoy',      colSpan: 2 },
  { id: 'mis_tareas',           colSpan: 2 },
  { id: 'advertencias',         colSpan: 2 },
  { id: 'acceso_rapido_admin',  colSpan: 2 },
]

const LAYOUT_ALMACENISTA: WidgetConfig[] = [
  { id: 'cola_pedidos',         colSpan: 2 },
  { id: 'alertas_inventario',   colSpan: 2 },
  { id: 'mis_tareas',           colSpan: 4 },
]

const LAYOUT_CAJERA: WidgetConfig[] = [
  { id: 'pedidos_para_cobrar',      colSpan: 2 },
  { id: 'ultimas_transacciones',    colSpan: 2 },
  { id: 'acceso_rapido_admin',      colSpan: 4 },
]

const LAYOUT_DEFAULT: WidgetConfig[] = [
  { id: 'mis_tareas',           colSpan: 2 },
  { id: 'mis_pedidos_hoy',      colSpan: 2 },
]

export function getLayoutForNivel(nivel: number): WidgetConfig[] {
  if (nivel <= 2) return LAYOUT_ADMIN
  if (nivel <= 4) return LAYOUT_ENCARGADO
  if (nivel === 5) return LAYOUT_ALMACENISTA
  if (nivel === 6) return LAYOUT_VENDEDORA
  if (nivel === 7) return LAYOUT_ALMACENISTA
  if (nivel === 8) return LAYOUT_CAJERA
  return LAYOUT_DEFAULT
}
