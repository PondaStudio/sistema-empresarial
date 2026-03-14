-- ============================================================
-- Migration 002: Productos, Inventario, Proveedores, Catálogo
-- Wave 2
-- ============================================================

-- ── CATEGORÍAS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categorias (
  id        uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre    varchar(100) NOT NULL,
  padre_id  uuid REFERENCES categorias(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

-- ── PRODUCTOS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS productos (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo       varchar(100) NOT NULL UNIQUE,
  nombre       varchar(300) NOT NULL,
  categoria_id uuid REFERENCES categorias(id),
  descripcion  text,
  foto_url     text,
  activo       boolean NOT NULL DEFAULT true,
  updated_at   timestamptz NOT NULL DEFAULT NOW()
);

CREATE TRIGGER productos_updated_at
  BEFORE UPDATE ON productos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_productos_codigo ON productos(codigo);
CREATE INDEX IF NOT EXISTS idx_productos_nombre ON productos USING gin(to_tsvector('spanish', nombre));

-- ── INVENTARIO ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventario (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id  uuid NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  sucursal_id  uuid NOT NULL REFERENCES sucursales(id) ON DELETE CASCADE,
  cantidad     int NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
  stock_minimo int NOT NULL DEFAULT 0,
  updated_at   timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (producto_id, sucursal_id)
);

CREATE TRIGGER inventario_updated_at
  BEFORE UPDATE ON inventario
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_inventario_producto  ON inventario(producto_id);
CREATE INDEX IF NOT EXISTS idx_inventario_sucursal  ON inventario(sucursal_id);

-- ── MOVIMIENTOS DE INVENTARIO ─────────────────────────────
CREATE TABLE IF NOT EXISTS movimientos_inventario (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id      uuid NOT NULL REFERENCES productos(id),
  sucursal_id      uuid NOT NULL REFERENCES sucursales(id),
  tipo             varchar(30) NOT NULL
                   CHECK (tipo IN ('entrada','salida','ajuste','merma','transferencia','cedis_import')),
  cantidad         int NOT NULL,
  referencia_id    uuid,
  referencia_tipo  varchar(50),
  notas            text,
  usuario_id       uuid REFERENCES usuarios(id),
  created_at       timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mov_inv_producto  ON movimientos_inventario(producto_id);
CREATE INDEX IF NOT EXISTS idx_mov_inv_sucursal  ON movimientos_inventario(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_mov_inv_fecha     ON movimientos_inventario(created_at DESC);

-- ── MERMAS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mermas (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id   uuid NOT NULL REFERENCES productos(id),
  sucursal_id   uuid NOT NULL REFERENCES sucursales(id),
  cantidad      int NOT NULL CHECK (cantidad > 0),
  motivo        text NOT NULL,
  registrado_por uuid REFERENCES usuarios(id),
  created_at    timestamptz NOT NULL DEFAULT NOW()
);

-- ── PROVEEDORES ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS proveedores (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre          varchar(200) NOT NULL,
  contacto_nombre varchar(200),
  contacto_tel    varchar(30),
  contacto_email  varchar(255),
  notas           text,
  activo          boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT NOW()
);

-- Productos que surte cada proveedor
CREATE TABLE IF NOT EXISTS productos_proveedor (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  proveedor_id uuid NOT NULL REFERENCES proveedores(id) ON DELETE CASCADE,
  producto_id  uuid NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  sku_proveedor varchar(100),
  UNIQUE (proveedor_id, producto_id)
);

-- ── PEDIDOS A PROVEEDOR ───────────────────────────────────
CREATE TABLE IF NOT EXISTS pedidos_proveedor (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  proveedor_id     uuid NOT NULL REFERENCES proveedores(id),
  sucursal_id      uuid NOT NULL REFERENCES sucursales(id),
  estado           varchar(30) NOT NULL DEFAULT 'pendiente'
                   CHECK (estado IN ('pendiente','confirmado','en_camino','recibido','cancelado')),
  fecha_solicitud  date NOT NULL DEFAULT CURRENT_DATE,
  fecha_estimada   date,
  fecha_recepcion  date,
  notas            text,
  creado_por       uuid REFERENCES usuarios(id),
  created_at       timestamptz NOT NULL DEFAULT NOW(),
  updated_at       timestamptz NOT NULL DEFAULT NOW()
);

CREATE TRIGGER pedidos_proveedor_updated_at
  BEFORE UPDATE ON pedidos_proveedor
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS items_pedido_proveedor (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id           uuid NOT NULL REFERENCES pedidos_proveedor(id) ON DELETE CASCADE,
  producto_id         uuid NOT NULL REFERENCES productos(id),
  cantidad_solicitada int NOT NULL CHECK (cantidad_solicitada > 0),
  cantidad_recibida   int DEFAULT 0
);

-- Trigger: actualizar inventario al recibir pedido proveedor
CREATE OR REPLACE FUNCTION actualizar_inventario_recepcion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado = 'recibido' AND OLD.estado != 'recibido' THEN
    INSERT INTO items_pedido_proveedor AS i
    SELECT uuid_generate_v4(), NEW.id, p.producto_id, p.cantidad_solicitada, p.cantidad_solicitada
    FROM items_pedido_proveedor p WHERE p.pedido_id = NEW.id
    ON CONFLICT DO NOTHING;

    -- Update inventario for each item
    UPDATE inventario inv
    SET cantidad = inv.cantidad + ipp.cantidad_recibida
    FROM items_pedido_proveedor ipp
    WHERE ipp.pedido_id = NEW.id
      AND inv.producto_id = ipp.producto_id
      AND inv.sucursal_id = NEW.sucursal_id;

    -- Register movements
    INSERT INTO movimientos_inventario (producto_id, sucursal_id, tipo, cantidad, referencia_id, referencia_tipo, usuario_id)
    SELECT ipp.producto_id, NEW.sucursal_id, 'entrada', ipp.cantidad_recibida, NEW.id, 'pedido_proveedor', NEW.creado_por
    FROM items_pedido_proveedor ipp WHERE ipp.pedido_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_recepcion_proveedor
  AFTER UPDATE ON pedidos_proveedor
  FOR EACH ROW EXECUTE FUNCTION actualizar_inventario_recepcion();

-- ── ROW LEVEL SECURITY ────────────────────────────────────
ALTER TABLE categorias              ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos               ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventario              ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_inventario  ENABLE ROW LEVEL SECURITY;
ALTER TABLE mermas                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores             ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos_proveedor     ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos_proveedor       ENABLE ROW LEVEL SECURITY;
ALTER TABLE items_pedido_proveedor  ENABLE ROW LEVEL SECURITY;

-- Productos y categorías: lectura para todos, escritura para nivel <= 5
CREATE POLICY "categorias_select" ON categorias FOR SELECT TO authenticated USING (true);
CREATE POLICY "categorias_write"  ON categorias FOR ALL   TO authenticated USING (get_my_rol_nivel() <= 5);
CREATE POLICY "productos_select"  ON productos  FOR SELECT TO authenticated USING (true);
CREATE POLICY "productos_write"   ON productos  FOR ALL   TO authenticated USING (get_my_rol_nivel() <= 5);

-- Inventario: visible por todos, editable por almacenistas (nivel <= 6)
CREATE POLICY "inventario_select" ON inventario FOR SELECT TO authenticated USING (true);
CREATE POLICY "inventario_write"  ON inventario FOR ALL   TO authenticated USING (get_my_rol_nivel() <= 6);
CREATE POLICY "mov_inv_select"    ON movimientos_inventario FOR SELECT TO authenticated USING (true);
CREATE POLICY "mov_inv_insert"    ON movimientos_inventario FOR INSERT TO authenticated WITH CHECK (get_my_rol_nivel() <= 6);
CREATE POLICY "mermas_select"     ON mermas FOR SELECT TO authenticated USING (true);
CREATE POLICY "mermas_insert"     ON mermas FOR INSERT TO authenticated WITH CHECK (get_my_rol_nivel() <= 6);

-- Proveedores: solo Creador y Gerente (nivel <= 2)
CREATE POLICY "proveedores_select" ON proveedores         FOR SELECT TO authenticated USING (get_my_rol_nivel() <= 2);
CREATE POLICY "proveedores_write"  ON proveedores         FOR ALL   TO authenticated USING (get_my_rol_nivel() <= 2);
CREATE POLICY "prod_prov_select"   ON productos_proveedor FOR SELECT TO authenticated USING (get_my_rol_nivel() <= 2);
CREATE POLICY "prod_prov_write"    ON productos_proveedor FOR ALL   TO authenticated USING (get_my_rol_nivel() <= 2);

-- Pedidos proveedor: visibles para nivel <= 5, editables para <= 6
CREATE POLICY "ped_prov_select" ON pedidos_proveedor      FOR SELECT TO authenticated USING (get_my_rol_nivel() <= 5);
CREATE POLICY "ped_prov_write"  ON pedidos_proveedor      FOR ALL   TO authenticated USING (get_my_rol_nivel() <= 6);
CREATE POLICY "items_ped_prov_select" ON items_pedido_proveedor FOR SELECT TO authenticated USING (get_my_rol_nivel() <= 5);
CREATE POLICY "items_ped_prov_write"  ON items_pedido_proveedor FOR ALL   TO authenticated USING (get_my_rol_nivel() <= 6);
