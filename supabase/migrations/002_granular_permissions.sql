-- =============================================================
-- MIGRACIÓN 002: Permisos granulares por sub-función
-- Ejecutar en Supabase SQL Editor
-- =============================================================

-- ── Tabla subfunciones ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subfunciones (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  modulo      TEXT NOT NULL,
  slug        TEXT NOT NULL,
  nombre      TEXT NOT NULL,
  descripcion TEXT,
  orden       SMALLINT DEFAULT 0,
  UNIQUE(modulo, slug)
);

-- ── Permisos por ROL (plantilla base por rol) ─────────────────
CREATE TABLE IF NOT EXISTS public.permisos_subfuncion_rol (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rol_id        UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  subfuncion_id UUID NOT NULL REFERENCES public.subfunciones(id) ON DELETE CASCADE,
  nivel         SMALLINT NOT NULL DEFAULT 0 CHECK (nivel IN (0, 1, 2)),
  UNIQUE(rol_id, subfuncion_id)
);
COMMENT ON COLUMN public.permisos_subfuncion_rol.nivel IS '0=sin acceso, 1=parcial, 2=total';

-- ── Permisos por USUARIO (overrides individuales) ─────────────
CREATE TABLE IF NOT EXISTS public.permisos_subfuncion_usuario (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id    UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  subfuncion_id UUID NOT NULL REFERENCES public.subfunciones(id) ON DELETE CASCADE,
  nivel         SMALLINT NOT NULL DEFAULT 0 CHECK (nivel IN (0, 1, 2)),
  created_by    UUID REFERENCES public.usuarios(id),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(usuario_id, subfuncion_id)
);
COMMENT ON COLUMN public.permisos_subfuncion_usuario.nivel IS '0=sin acceso, 1=parcial, 2=total';

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE public.subfunciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permisos_subfuncion_rol ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permisos_subfuncion_usuario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subfunciones_select_all" ON public.subfunciones
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "psr_select_all" ON public.permisos_subfuncion_rol
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "psu_select_own_or_creador" ON public.permisos_subfuncion_usuario
  FOR SELECT TO authenticated
  USING (
    usuario_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.usuarios u
      JOIN public.roles r ON r.id = u.rol_id
      WHERE u.id = auth.uid() AND r.nivel = 1
    )
  );

CREATE POLICY "psu_write_creador_only" ON public.permisos_subfuncion_usuario
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      JOIN public.roles r ON r.id = u.rol_id
      WHERE u.id = auth.uid() AND r.nivel = 1
    )
  );

-- ── Índices ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_psr_rol_id ON public.permisos_subfuncion_rol(rol_id);
CREATE INDEX IF NOT EXISTS idx_psu_usuario_id ON public.permisos_subfuncion_usuario(usuario_id);

-- =============================================================
-- SEED: Sub-funciones por módulo
-- =============================================================
INSERT INTO public.subfunciones (modulo, slug, nombre, orden) VALUES
  -- Inventario
  ('inventario', 'buscar_producto',    'Buscar producto',         1),
  ('inventario', 'recibir_producto',   'Recibir producto',        2),
  ('inventario', 'alta_producto',      'Dar de alta producto',    3),
  ('inventario', 'baja_producto',      'Baja de producto',        4),
  ('inventario', 'traspaso',           'Traspaso',                5),
  ('inventario', 'inventario_fisico',  'Inventario físico',       6),
  ('inventario', 'generar_etiquetas',  'Generar etiquetas',       7),
  ('inventario', 'notas_recepcion',    'Notas de recepción',      8),
  -- Pedidos de venta
  ('pedidos_venta', 'crear_pedido',       'Crear pedido',         1),
  ('pedidos_venta', 'ver_pedidos',        'Ver pedidos',          2),
  ('pedidos_venta', 'imprimir_nota',      'Imprimir nota',        3),
  ('pedidos_venta', 'confirmar_surtido',  'Confirmar surtido',    4),
  ('pedidos_venta', 'escanear_entrega',   'Escanear entrega',     5),
  ('pedidos_venta', 'cancelar_pedido',    'Cancelar pedido',      6),
  -- Pedidos a proveedor
  ('pedidos_proveedor', 'ver_pedidos_proveedor',   'Ver pedidos',            1),
  ('pedidos_proveedor', 'crear_pedido_proveedor',  'Crear pedido',           2),
  ('pedidos_proveedor', 'recibir_pedido',          'Recibir pedido',         3),
  ('pedidos_proveedor', 'notas_recepcion_prov',    'Notas de recepción',     4),
  -- Comunicación
  ('comunicacion', 'ver_canales',        'Ver canales',           1),
  ('comunicacion', 'enviar_mensajes',    'Enviar mensajes',       2),
  ('comunicacion', 'crear_canales',      'Crear canales',         3),
  ('comunicacion', 'mensajes_directos',  'Mensajes directos',     4),
  ('comunicacion', 'notas_de_voz',       'Notas de voz',          5),
  -- RRHH
  ('rrhh', 'ver_expediente',              'Ver expediente',             1),
  ('rrhh', 'ver_asistencia',              'Ver asistencia',             2),
  ('rrhh', 'ver_bonos',                   'Ver bonos',                  3),
  ('rrhh', 'registrar_llamada_atencion',  'Registrar llamada de atención', 4),
  ('rrhh', 'ver_vacaciones',              'Ver vacaciones',             5),
  -- Tareas
  ('tareas', 'ver_tareas',        'Ver tareas',       1),
  ('tareas', 'crear_tareas',      'Crear tareas',     2),
  ('tareas', 'completar_tareas',  'Completar tareas', 3),
  ('tareas', 'aprobar_tareas',    'Aprobar tareas',   4),
  ('tareas', 'asignar_tareas',    'Asignar tareas',   5),
  -- Dashboard
  ('dashboard', 'ver_kpis_propios',    'Ver KPIs propios',      1),
  ('dashboard', 'ver_kpis_sucursal',   'Ver KPIs de sucursal',  2),
  ('dashboard', 'ver_kpis_globales',   'Ver KPIs globales',     3),
  ('dashboard', 'exportar_reportes',   'Exportar reportes',     4),
  -- Facturación
  ('facturacion', 'ver_facturas',      'Ver facturas',       1),
  ('facturacion', 'crear_factura',     'Crear factura',      2),
  ('facturacion', 'imprimir_factura',  'Imprimir factura',   3),
  -- Paqueterías
  ('paqueterias', 'ver_envios',          'Ver envíos',             1),
  ('paqueterias', 'crear_hoja_envio',    'Crear hoja de envío',    2),
  ('paqueterias', 'imprimir_hoja',       'Imprimir hoja',          3),
  -- Clientes
  ('clientes', 'buscar_cliente',      'Buscar cliente',      1),
  ('clientes', 'crear_cliente',       'Crear cliente',       2),
  ('clientes', 'ver_historial',       'Ver historial',       3),
  ('clientes', 'ver_datos_fiscales',  'Ver datos fiscales',  4),
  -- Catálogo
  ('catalogo', 'buscar_producto_catalogo',  'Buscar producto',          1),
  ('catalogo', 'ver_detalles_producto',     'Ver detalles de producto', 2),
  -- Avisos
  ('avisos', 'ver_avisos',      'Ver avisos',      1),
  ('avisos', 'crear_avisos',    'Crear avisos',    2),
  ('avisos', 'publicar_avisos', 'Publicar avisos', 3),
  -- Capacitación
  ('capacitacion', 'ver_cursos',       'Ver cursos',       1),
  ('capacitacion', 'completar_cursos', 'Completar cursos', 2),
  ('capacitacion', 'asignar_cursos',   'Asignar cursos',   3),
  ('capacitacion', 'crear_cursos',     'Crear cursos',     4),
  -- Promociones
  ('promociones', 'ver_promociones',     'Ver promociones',    1),
  ('promociones', 'descargar_material',  'Descargar material', 2),
  ('promociones', 'crear_promocion',     'Crear promoción',    3),
  ('promociones', 'publicar_promocion',  'Publicar promoción', 4)
ON CONFLICT (modulo, slug) DO NOTHING;
