export interface Rol {
  id: string
  nombre: string
  nivel: number
  descripcion: string
}

export interface Sucursal {
  id: string
  nombre: string
  direccion?: string
  horarios?: Record<string, string>
  areas_internas?: string[]
  activa: boolean
}

export interface Usuario {
  id: string
  nombre: string
  email: string
  rol_id: string
  sucursal_id?: string | null
  estado_presencia: 'disponible' | 'ocupado' | 'comiendo' | 'no_disponible' | 'ausente'
  foto_url?: string | null
  activo: boolean
  numero_agente?: string | null
  subtipo?: string | null
  roles?: Pick<Rol, 'nivel' | 'nombre'>
  sucursales?: Pick<Sucursal, 'nombre'>
}

export type Permisos = Record<string, Record<string, boolean>>

export interface AuthSession {
  access_token: string
  refresh_token: string
  expires_at: number
  user: Usuario
}

export const ESTADOS_PRESENCIA = [
  { value: 'disponible',    label: 'Disponible',    color: 'bg-green-500' },
  { value: 'ocupado',       label: 'Ocupado',       color: 'bg-red-500' },
  { value: 'comiendo',      label: 'Comiendo',      color: 'bg-yellow-500' },
  { value: 'no_disponible', label: 'No disponible', color: 'bg-gray-500' },
  { value: 'ausente',       label: 'Ausente',       color: 'bg-orange-500' },
] as const

export const MODULOS = [
  'login','permisos','dashboard','analisis','ocr',
  'pedidos_venta','pedidos_proveedor','inventario','comunicacion','rrhh',
  'tareas','facturacion','paqueterias','clientes','capacitacion',
  'evaluaciones','promociones','avisos','proveedores','contrataciones',
  'bitacora','catalogo','formatos','mapa','garantias','precios','notificaciones',
] as const

export const ACCIONES = ['VER','CREAR','EDITAR','ELIMINAR','EXPORTAR','APROBAR','IMPRIMIR'] as const
