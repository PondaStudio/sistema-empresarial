-- ============================================================
-- PERMISSIONS MATRIX SEED
-- Matriz Rol × Acción × Módulo (11 roles × 7 acciones × 27 módulos)
-- Generada según especificaciones del sistema v1.0
--
-- Convención de acciones:
--   VER, CREAR, EDITAR, ELIMINAR, EXPORTAR, APROBAR, IMPRIMIR
--
-- Convención de módulos (slugs):
--   login, permisos, dashboard, analisis, ocr,
--   pedidos_venta, pedidos_proveedor, inventario, comunicacion, rrhh,
--   tareas, facturacion, paqueterias, clientes, capacitacion,
--   evaluaciones, promociones, avisos, proveedores, contrataciones,
--   bitacora, catalogo, formatos, mapa, garantias, precios, notificaciones
--
-- Niveles de rol:
--   1=Creador, 2=Gerente, 3A=Sup.Dueño, 3B=Sup.Familiar,
--   4=Admin G2, 5=Enc.Sucursal, 6=Enc.Bodega, 7=Admin G1,
--   8=Cajeras, 9=Almacenistas G1, 10=Vendedoras, 11=Promotores
-- ============================================================

-- Helper: insert all actions for a role+module combo
-- Usage: call insert_permisos_base(rol_id, modulo, ver, crear, editar, eliminar, exportar, aprobar, imprimir)

DO $$
DECLARE
  r_creador     uuid;
  r_gerente     uuid;
  r_sup_dueno   uuid;
  r_sup_fam     uuid;
  r_admin_g2    uuid;
  r_enc_suc     uuid;
  r_enc_bod     uuid;
  r_admin_g1    uuid;
  r_cajeras     uuid;
  r_almacen     uuid;
  r_vendedoras  uuid;
  r_promotores  uuid;
BEGIN
  -- Fetch role IDs by nivel
  SELECT id INTO r_creador   FROM roles WHERE nivel = 1 LIMIT 1;
  SELECT id INTO r_gerente   FROM roles WHERE nivel = 2 LIMIT 1;
  SELECT id INTO r_sup_dueno FROM roles WHERE nombre ILIKE '%supervisor%dueño%' LIMIT 1;
  SELECT id INTO r_sup_fam   FROM roles WHERE nombre ILIKE '%supervisor%familiar%' LIMIT 1;
  SELECT id INTO r_admin_g2  FROM roles WHERE nivel = 4 LIMIT 1;
  SELECT id INTO r_enc_suc   FROM roles WHERE nivel = 5 LIMIT 1;
  SELECT id INTO r_enc_bod   FROM roles WHERE nivel = 6 LIMIT 1;
  SELECT id INTO r_admin_g1  FROM roles WHERE nivel = 7 LIMIT 1;
  SELECT id INTO r_cajeras   FROM roles WHERE nivel = 8 LIMIT 1;
  SELECT id INTO r_almacen   FROM roles WHERE nivel = 9 LIMIT 1;
  SELECT id INTO r_vendedoras FROM roles WHERE nivel = 10 LIMIT 1;
  SELECT id INTO r_promotores FROM roles WHERE nivel = 11 LIMIT 1;

  -- ── CREADOR (nivel 1) — acceso absoluto ──────────────────
  INSERT INTO permisos_base (rol_id, modulo, accion, habilitado)
  SELECT r_creador, m.modulo, a.accion, true
  FROM (VALUES
    ('login'),('permisos'),('dashboard'),('analisis'),('ocr'),
    ('pedidos_venta'),('pedidos_proveedor'),('inventario'),('comunicacion'),('rrhh'),
    ('tareas'),('facturacion'),('paqueterias'),('clientes'),('capacitacion'),
    ('evaluaciones'),('promociones'),('avisos'),('proveedores'),('contrataciones'),
    ('bitacora'),('catalogo'),('formatos'),('mapa'),('garantias'),('precios'),('notificaciones')
  ) AS m(modulo)
  CROSS JOIN (VALUES ('VER'),('CREAR'),('EDITAR'),('ELIMINAR'),('EXPORTAR'),('APROBAR'),('IMPRIMIR')) AS a(accion)
  ON CONFLICT (rol_id, modulo, accion) DO UPDATE SET habilitado = EXCLUDED.habilitado;

  -- ── GERENTE GENERAL (nivel 2) — igual que Creador excepto permisos ──
  INSERT INTO permisos_base (rol_id, modulo, accion, habilitado)
  SELECT r_gerente, m.modulo, a.accion, true
  FROM (VALUES
    ('login'),('dashboard'),('analisis'),('ocr'),
    ('pedidos_venta'),('pedidos_proveedor'),('inventario'),('comunicacion'),('rrhh'),
    ('tareas'),('facturacion'),('paqueterias'),('clientes'),('capacitacion'),
    ('evaluaciones'),('promociones'),('avisos'),('proveedores'),('contrataciones'),
    ('bitacora'),('catalogo'),('formatos'),('mapa'),('garantias'),('precios'),('notificaciones')
  ) AS m(modulo)
  CROSS JOIN (VALUES ('VER'),('CREAR'),('EDITAR'),('ELIMINAR'),('EXPORTAR'),('APROBAR'),('IMPRIMIR')) AS a(accion)
  ON CONFLICT (rol_id, modulo, accion) DO UPDATE SET habilitado = EXCLUDED.habilitado;

  -- Gerente NO puede gestionar permisos de otros
  INSERT INTO permisos_base (rol_id, modulo, accion, habilitado) VALUES
    (r_gerente, 'permisos', 'VER',      false),
    (r_gerente, 'permisos', 'CREAR',    false),
    (r_gerente, 'permisos', 'EDITAR',   false),
    (r_gerente, 'permisos', 'ELIMINAR', false)
  ON CONFLICT (rol_id, modulo, accion) DO UPDATE SET habilitado = EXCLUDED.habilitado;

  -- ── ADMIN G2 (nivel 4) — operativo alto ──────────────────
  INSERT INTO permisos_base (rol_id, modulo, accion, habilitado)
  SELECT r_admin_g2, m.modulo, a.accion,
    CASE
      WHEN m.modulo IN ('proveedores','permisos') THEN false
      WHEN a.accion = 'ELIMINAR' AND m.modulo NOT IN ('tareas','mensajes') THEN false
      ELSE true
    END
  FROM (VALUES
    ('login'),('dashboard'),('analisis'),('pedidos_venta'),('pedidos_proveedor'),
    ('inventario'),('comunicacion'),('rrhh'),('tareas'),('facturacion'),
    ('paqueterias'),('clientes'),('capacitacion'),('evaluaciones'),('promociones'),
    ('avisos'),('contrataciones'),('bitacora'),('catalogo'),('formatos'),
    ('mapa'),('garantias'),('precios'),('notificaciones')
  ) AS m(modulo)
  CROSS JOIN (VALUES ('VER'),('CREAR'),('EDITAR'),('ELIMINAR'),('EXPORTAR'),('APROBAR'),('IMPRIMIR')) AS a(accion)
  ON CONFLICT (rol_id, modulo, accion) DO UPDATE SET habilitado = EXCLUDED.habilitado;

  -- ── ENCARGADO DE SUCURSAL (nivel 5) ──────────────────────
  INSERT INTO permisos_base (rol_id, modulo, accion, habilitado)
  SELECT r_enc_suc, m.modulo, a.accion,
    CASE
      WHEN m.modulo IN ('proveedores','permisos','analisis','ocr') AND a.accion != 'VER' THEN false
      WHEN m.modulo IN ('rrhh') AND a.accion IN ('ELIMINAR') THEN false
      ELSE true
    END
  FROM (VALUES
    ('login'),('dashboard'),('pedidos_venta'),('pedidos_proveedor'),
    ('inventario'),('comunicacion'),('rrhh'),('tareas'),('facturacion'),
    ('paqueterias'),('clientes'),('capacitacion'),('evaluaciones'),('promociones'),
    ('avisos'),('bitacora'),('catalogo'),('formatos'),('mapa'),('garantias'),
    ('precios'),('notificaciones'),('analisis')
  ) AS m(modulo)
  CROSS JOIN (VALUES ('VER'),('CREAR'),('EDITAR'),('ELIMINAR'),('EXPORTAR'),('APROBAR'),('IMPRIMIR')) AS a(accion)
  ON CONFLICT (rol_id, modulo, accion) DO UPDATE SET habilitado = EXCLUDED.habilitado;

  -- ── ENCARGADO DE BODEGA (nivel 6) ────────────────────────
  INSERT INTO permisos_base (rol_id, modulo, accion, habilitado)
  SELECT r_enc_bod, m.modulo, a.accion,
    CASE
      WHEN m.modulo IN ('facturacion','paqueterias') THEN false
      WHEN m.modulo IN ('inventario','pedidos_proveedor') THEN true
      WHEN a.accion IN ('ELIMINAR') THEN false
      ELSE true
    END
  FROM (VALUES
    ('login'),('dashboard'),('pedidos_venta'),('pedidos_proveedor'),
    ('inventario'),('comunicacion'),('rrhh'),('tareas'),('catalogo'),
    ('formatos'),('mapa'),('garantias'),('notificaciones'),('avisos')
  ) AS m(modulo)
  CROSS JOIN (VALUES ('VER'),('CREAR'),('EDITAR'),('ELIMINAR'),('EXPORTAR'),('APROBAR'),('IMPRIMIR')) AS a(accion)
  ON CONFLICT (rol_id, modulo, accion) DO UPDATE SET habilitado = EXCLUDED.habilitado;

  -- ── ADMIN G1 (nivel 7) ────────────────────────────────────
  INSERT INTO permisos_base (rol_id, modulo, accion, habilitado)
  SELECT r_admin_g1, m.modulo, a.accion,
    CASE
      WHEN a.accion IN ('ELIMINAR') THEN false
      WHEN m.modulo IN ('paqueterias','clientes') AND a.accion IN ('VER','IMPRIMIR','APROBAR') THEN true
      ELSE true
    END
  FROM (VALUES
    ('login'),('dashboard'),('pedidos_venta'),('inventario'),
    ('comunicacion'),('tareas'),('facturacion'),('paqueterias'),('clientes'),
    ('catalogo'),('formatos'),('mapa'),('notificaciones'),('avisos'),('garantias')
  ) AS m(modulo)
  CROSS JOIN (VALUES ('VER'),('CREAR'),('EDITAR'),('ELIMINAR'),('EXPORTAR'),('APROBAR'),('IMPRIMIR')) AS a(accion)
  ON CONFLICT (rol_id, modulo, accion) DO UPDATE SET habilitado = EXCLUDED.habilitado;

  -- ── CAJERAS (nivel 8) ─────────────────────────────────────
  INSERT INTO permisos_base (rol_id, modulo, accion, habilitado) VALUES
    (r_cajeras, 'login',          'VER',     true),
    (r_cajeras, 'dashboard',      'VER',     true),
    (r_cajeras, 'pedidos_venta',  'VER',     true),
    (r_cajeras, 'pedidos_venta',  'IMPRIMIR',true),
    (r_cajeras, 'catalogo',       'VER',     true),
    (r_cajeras, 'comunicacion',   'VER',     true),
    (r_cajeras, 'comunicacion',   'CREAR',   true),
    (r_cajeras, 'notificaciones', 'VER',     true),
    (r_cajeras, 'avisos',         'VER',     true),
    (r_cajeras, 'mapa',           'VER',     true)
  ON CONFLICT (rol_id, modulo, accion) DO UPDATE SET habilitado = EXCLUDED.habilitado;

  -- ── ALMACENISTAS G1 (nivel 9) ─────────────────────────────
  INSERT INTO permisos_base (rol_id, modulo, accion, habilitado) VALUES
    (r_almacen, 'login',              'VER',    true),
    (r_almacen, 'dashboard',          'VER',    true),
    (r_almacen, 'pedidos_venta',      'VER',    true),
    (r_almacen, 'pedidos_venta',      'EDITAR', true),  -- confirmar/rechazar items
    (r_almacen, 'pedidos_proveedor',  'VER',    true),
    (r_almacen, 'inventario',         'VER',    true),
    (r_almacen, 'inventario',         'EDITAR', true),
    (r_almacen, 'catalogo',           'VER',    true),
    (r_almacen, 'comunicacion',       'VER',    true),
    (r_almacen, 'comunicacion',       'CREAR',  true),
    (r_almacen, 'tareas',             'VER',    true),
    (r_almacen, 'tareas',             'EDITAR', true),
    (r_almacen, 'notificaciones',     'VER',    true),
    (r_almacen, 'avisos',             'VER',    true),
    (r_almacen, 'mapa',               'VER',    true)
  ON CONFLICT (rol_id, modulo, accion) DO UPDATE SET habilitado = EXCLUDED.habilitado;

  -- ── VENDEDORAS (nivel 10) ─────────────────────────────────
  INSERT INTO permisos_base (rol_id, modulo, accion, habilitado) VALUES
    (r_vendedoras, 'login',         'VER',    true),
    (r_vendedoras, 'dashboard',     'VER',    true),
    (r_vendedoras, 'pedidos_venta', 'VER',    true),
    (r_vendedoras, 'pedidos_venta', 'CREAR',  true),
    (r_vendedoras, 'pedidos_venta', 'EDITAR', true),
    (r_vendedoras, 'pedidos_venta', 'IMPRIMIR', true),
    (r_vendedoras, 'catalogo',      'VER',    true),
    (r_vendedoras, 'clientes',      'VER',    true),
    (r_vendedoras, 'clientes',      'CREAR',  true),
    (r_vendedoras, 'promociones',   'VER',    true),
    (r_vendedoras, 'comunicacion',  'VER',    true),
    (r_vendedoras, 'comunicacion',  'CREAR',  true),
    (r_vendedoras, 'tareas',        'VER',    true),
    (r_vendedoras, 'tareas',        'EDITAR', true),
    (r_vendedoras, 'notificaciones','VER',    true),
    (r_vendedoras, 'avisos',        'VER',    true),
    (r_vendedoras, 'mapa',          'VER',    true)
  ON CONFLICT (rol_id, modulo, accion) DO UPDATE SET habilitado = EXCLUDED.habilitado;

  -- ── PROMOTORES (nivel 11) — acceso mínimo ────────────────
  INSERT INTO permisos_base (rol_id, modulo, accion, habilitado) VALUES
    (r_promotores, 'login',         'VER', true),
    (r_promotores, 'dashboard',     'VER', true),
    (r_promotores, 'catalogo',      'VER', true),
    (r_promotores, 'promociones',   'VER', true),
    (r_promotores, 'comunicacion',  'VER', true),
    (r_promotores, 'comunicacion',  'CREAR', true),
    (r_promotores, 'notificaciones','VER', true),
    (r_promotores, 'avisos',        'VER', true),
    (r_promotores, 'mapa',          'VER', true)
  ON CONFLICT (rol_id, modulo, accion) DO UPDATE SET habilitado = EXCLUDED.habilitado;

END $$;
