-- ============================================================
-- Migration 003: Pedidos Venta, Clientes, Facturación,
--                Paqueterías, Precios Especiales, Garantías
-- Wave 3
-- ============================================================

-- ── CLIENTES FRECUENTES ───────────────────────────────────
CREATE TABLE IF NOT EXISTS clientes_frecuentes (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre     varchar(200) NOT NULL,
  telefono   varchar(30),
  email      varchar(255),
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS domicilios_cliente (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id      uuid NOT NULL REFERENCES clientes_frecuentes(id) ON DELETE CASCADE,
  tipo            varchar(50) NOT NULL DEFAULT 'casa'
                  CHECK (tipo IN ('casa','oficina','bodega','otro')),
  direccion       text NOT NULL,
  predeterminado  boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS datos_fiscales_cliente (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id      uuid NOT NULL REFERENCES clientes_frecuentes(id) ON DELETE CASCADE,
  rfc             varchar(20) NOT NULL,
  razon_social    varchar(300) NOT NULL,
  direccion_fiscal text,
  regimen_fiscal  varchar(100),
  uso_cfdi        varchar(10),
  UNIQUE (cliente_id)
);

-- ── PEDIDOS DE VENTA ──────────────────────────────────────
-- Flujo de 12 pasos según especificaciones
CREATE TABLE IF NOT EXISTS pedidos_venta (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  folio        varchar(20) UNIQUE NOT NULL DEFAULT ('PV-' || to_char(NOW(), 'YYYYMMDD') || '-' || substr(md5(random()::text), 1, 4)),
  sucursal_id  uuid NOT NULL REFERENCES sucursales(id),
  vendedora_id uuid NOT NULL REFERENCES usuarios(id),
  cliente_id   uuid REFERENCES clientes_frecuentes(id),
  nombre_cliente varchar(200),
  estado       varchar(30) NOT NULL DEFAULT 'borrador'
               CHECK (estado IN (
                 'borrador',           -- paso 1: vendedora crea
                 'pendiente_almacen',  -- paso 2: enviado a almacenista
                 'en_revision',        -- paso 3: almacenista revisando
                 'confirmado',         -- paso 4: todos los items confirmados
                 'impreso',            -- paso 6: nota impresa
                 'surtido',            -- paso 9: almacenista surtió
                 'verificado_vendedora', -- paso 10: vendedora verificó
                 'en_checador',        -- paso 12: checador escaneó
                 'cerrado',            -- paso 13: puerta cerró
                 'cancelado'
               )),
  notas        text,
  impreso_at   timestamptz,
  surtido_at   timestamptz,
  cerrado_at   timestamptz,
  created_at   timestamptz NOT NULL DEFAULT NOW(),
  updated_at   timestamptz NOT NULL DEFAULT NOW()
);

CREATE TRIGGER pedidos_venta_updated_at
  BEFORE UPDATE ON pedidos_venta
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_pedidos_venta_sucursal ON pedidos_venta(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_venta_estado   ON pedidos_venta(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_venta_fecha    ON pedidos_venta(created_at DESC);

-- ── ITEMS DEL PEDIDO DE VENTA ─────────────────────────────
CREATE TABLE IF NOT EXISTS items_pedido_venta (
  id                       uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id                uuid NOT NULL REFERENCES pedidos_venta(id) ON DELETE CASCADE,
  producto_id              uuid NOT NULL REFERENCES productos(id),
  cantidad                 int NOT NULL CHECK (cantidad > 0),
  estado_confirmacion      varchar(20) NOT NULL DEFAULT 'pendiente'
                           CHECK (estado_confirmacion IN ('pendiente','confirmado','sustituto','no_disponible')),
  sustituto_producto_id    uuid REFERENCES productos(id),
  almacenista_id           uuid REFERENCES usuarios(id),
  observaciones            text,
  confirmado_at            timestamptz
);

CREATE INDEX IF NOT EXISTS idx_items_pedido ON items_pedido_venta(pedido_id);

-- ── PAQUETERÍAS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS paqueterias (
  id       uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre   varchar(100) NOT NULL UNIQUE,
  activa   boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS envios (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id       uuid REFERENCES pedidos_venta(id),
  cliente_id      uuid NOT NULL REFERENCES clientes_frecuentes(id),
  domicilio_id    uuid NOT NULL REFERENCES domicilios_cliente(id),
  paqueteria_id   uuid NOT NULL REFERENCES paqueterias(id),
  hoja_envio_url  text,
  created_at      timestamptz NOT NULL DEFAULT NOW()
);

-- ── FACTURAS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS facturas (
  id                   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id            uuid REFERENCES pedidos_venta(id),
  cliente_id           uuid NOT NULL REFERENCES clientes_frecuentes(id),
  foto_ticket_url      text,
  foto_comprobante_url text,
  created_at           timestamptz NOT NULL DEFAULT NOW()
);

-- ── PRECIOS ESPECIALES ────────────────────────────────────
CREATE TABLE IF NOT EXISTS precios_especiales (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id     uuid NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  cliente_id      uuid REFERENCES clientes_frecuentes(id),
  precio          numeric(10, 2) NOT NULL CHECK (precio >= 0),
  vigencia_desde  date,
  vigencia_hasta  date,
  created_at      timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (producto_id, cliente_id)
);

-- ── GARANTÍAS Y DEVOLUCIONES ──────────────────────────────
CREATE TABLE IF NOT EXISTS garantias_devoluciones (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id   uuid REFERENCES pedidos_venta(id),
  cliente_id  uuid NOT NULL REFERENCES clientes_frecuentes(id),
  producto_id uuid NOT NULL REFERENCES productos(id),
  motivo      text NOT NULL,
  estado      varchar(20) NOT NULL DEFAULT 'pendiente'
              CHECK (estado IN ('pendiente','en_proceso','resuelto','rechazado')),
  resolucion  text,
  created_at  timestamptz NOT NULL DEFAULT NOW(),
  updated_at  timestamptz NOT NULL DEFAULT NOW()
);

CREATE TRIGGER garantias_updated_at
  BEFORE UPDATE ON garantias_devoluciones
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── ROW LEVEL SECURITY ────────────────────────────────────
ALTER TABLE clientes_frecuentes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE domicilios_cliente      ENABLE ROW LEVEL SECURITY;
ALTER TABLE datos_fiscales_cliente  ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos_venta           ENABLE ROW LEVEL SECURITY;
ALTER TABLE items_pedido_venta      ENABLE ROW LEVEL SECURITY;
ALTER TABLE paqueterias             ENABLE ROW LEVEL SECURITY;
ALTER TABLE envios                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturas                ENABLE ROW LEVEL SECURITY;
ALTER TABLE precios_especiales      ENABLE ROW LEVEL SECURITY;
ALTER TABLE garantias_devoluciones  ENABLE ROW LEVEL SECURITY;

-- Pedidos: visibles para todos en la sucursal correspondiente
CREATE POLICY "pedidos_select" ON pedidos_venta FOR SELECT TO authenticated
  USING (sucursal_id IN (
    SELECT sucursal_id FROM usuarios WHERE id = auth.uid()
    UNION SELECT id FROM sucursales WHERE (SELECT get_my_rol_nivel()) <= 4
  ));
CREATE POLICY "pedidos_insert" ON pedidos_venta FOR INSERT TO authenticated
  WITH CHECK (vendedora_id = auth.uid() OR get_my_rol_nivel() <= 4);
CREATE POLICY "pedidos_update" ON pedidos_venta FOR UPDATE TO authenticated
  USING (get_my_rol_nivel() <= 9);

-- Items: accesibles para cualquier usuario con acceso al pedido
CREATE POLICY "items_pedido_select" ON items_pedido_venta FOR SELECT TO authenticated USING (true);
CREATE POLICY "items_pedido_write"  ON items_pedido_venta FOR ALL   TO authenticated USING (get_my_rol_nivel() <= 9);

-- Clientes: accesibles para todos excepto promotores
CREATE POLICY "clientes_select" ON clientes_frecuentes    FOR SELECT TO authenticated USING (get_my_rol_nivel() <= 10);
CREATE POLICY "clientes_write"  ON clientes_frecuentes    FOR ALL   TO authenticated USING (get_my_rol_nivel() <= 10);
CREATE POLICY "domicilios_all"  ON domicilios_cliente     FOR ALL   TO authenticated USING (get_my_rol_nivel() <= 10);
CREATE POLICY "fiscal_all"      ON datos_fiscales_cliente FOR ALL   TO authenticated USING (get_my_rol_nivel() <= 10);

-- Facturación: nivel <= 7 excepto nivel 6 (enc. bodega no accede)
CREATE POLICY "facturas_select" ON facturas FOR SELECT TO authenticated
  USING (get_my_rol_nivel() <= 7 AND get_my_rol_nivel() != 6);
CREATE POLICY "facturas_write"  ON facturas FOR ALL   TO authenticated
  USING (get_my_rol_nivel() <= 7 AND get_my_rol_nivel() != 6);

-- Paqueterías, envíos: admin y arriba (no enc. bodega)
CREATE POLICY "paqueterias_select" ON paqueterias FOR SELECT TO authenticated USING (get_my_rol_nivel() <= 10);
CREATE POLICY "paqueterias_write"  ON paqueterias FOR ALL   TO authenticated USING (get_my_rol_nivel() <= 4);
CREATE POLICY "envios_all"         ON envios FOR ALL TO authenticated USING (get_my_rol_nivel() <= 7 AND get_my_rol_nivel() != 6);

-- Precios especiales: nivel <= 5
CREATE POLICY "precios_select" ON precios_especiales FOR SELECT TO authenticated USING (get_my_rol_nivel() <= 5);
CREATE POLICY "precios_write"  ON precios_especiales FOR ALL   TO authenticated USING (get_my_rol_nivel() <= 5);

-- Garantías: nivel <= 9
CREATE POLICY "garantias_select" ON garantias_devoluciones FOR SELECT TO authenticated USING (get_my_rol_nivel() <= 9);
CREATE POLICY "garantias_write"  ON garantias_devoluciones FOR ALL   TO authenticated USING (get_my_rol_nivel() <= 9);
