-- ============================================================
-- Migration 001: Core — Roles, Sucursales, Usuarios, Permisos
-- Wave 1: Auth + Permissions + Users + Branches
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Updated_at trigger helper ──────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── ROLES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre      varchar(100) NOT NULL UNIQUE,
  nivel       int NOT NULL CHECK (nivel BETWEEN 1 AND 11),
  descripcion text,
  created_at  timestamptz NOT NULL DEFAULT NOW()
);

-- Seed roles
INSERT INTO roles (nombre, nivel, descripcion) VALUES
  ('Creador',                   1,  'Acceso absoluto a todo el sistema'),
  ('Gerente General',           2,  'Acceso total operativo'),
  ('Supervisor Dueño',          3,  'Acceso limitado configurado por Creador'),
  ('Supervisor Familiar',       3,  'Más limitado que Supervisor Dueño'),
  ('Administrador G2',          4,  'Casi al nivel del Gerente General'),
  ('Encargado de Sucursal',     5,  'Administra su sucursal'),
  ('Encargado de Bodega',       6,  'Gestiona inventario y surtido'),
  ('Administrador G1',          7,  'Permisos diferenciados'),
  ('Cajeras',                   8,  'Operación de caja y atención al cliente'),
  ('Almacenistas G1',           9,  'Bodega y piso'),
  ('Vendedoras',                10, 'Atención y venta al cliente'),
  ('Promotores de Marca',       11, 'Nivel base, promoción de productos')
ON CONFLICT (nombre) DO NOTHING;

-- ── SUCURSALES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sucursales (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre          varchar(150) NOT NULL,
  direccion       text,
  horarios        jsonb DEFAULT '{}',
  areas_internas  jsonb DEFAULT '[]',
  activa          boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT NOW()
);

-- ── USUARIOS ──────────────────────────────────────────────
-- Note: auth is handled by Supabase Auth; this table extends the profile
CREATE TABLE IF NOT EXISTS usuarios (
  id               uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre           varchar(200) NOT NULL,
  email            varchar(255) NOT NULL UNIQUE,
  rol_id           uuid NOT NULL REFERENCES roles(id),
  sucursal_id      uuid REFERENCES sucursales(id),
  estado_presencia varchar(20) NOT NULL DEFAULT 'disponible'
                   CHECK (estado_presencia IN ('disponible','ocupado','comiendo','no_disponible','ausente')),
  foto_url         text,
  activo           boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT NOW(),
  updated_at       timestamptz NOT NULL DEFAULT NOW()
);

CREATE TRIGGER usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── PERMISOS BASE (defaults por rol) ──────────────────────
CREATE TABLE IF NOT EXISTS permisos_base (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  rol_id     uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  modulo     varchar(50) NOT NULL,
  accion     varchar(20) NOT NULL CHECK (accion IN ('VER','CREAR','EDITAR','ELIMINAR','EXPORTAR','APROBAR','IMPRIMIR')),
  habilitado boolean NOT NULL DEFAULT false,
  UNIQUE (rol_id, modulo, accion)
);

-- ── PERMISOS USUARIO (overrides individuales) ─────────────
CREATE TABLE IF NOT EXISTS permisos_usuario (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id     uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  modulo         varchar(50) NOT NULL,
  accion         varchar(20) NOT NULL CHECK (accion IN ('VER','CREAR','EDITAR','ELIMINAR','EXPORTAR','APROBAR','IMPRIMIR')),
  habilitado     boolean NOT NULL,
  modificado_por uuid REFERENCES usuarios(id),
  updated_at     timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (usuario_id, modulo, accion)
);

CREATE TRIGGER permisos_usuario_updated_at
  BEFORE UPDATE ON permisos_usuario
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── ROW LEVEL SECURITY ────────────────────────────────────

ALTER TABLE roles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE sucursales      ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios        ENABLE ROW LEVEL SECURITY;
ALTER TABLE permisos_base   ENABLE ROW LEVEL SECURITY;
ALTER TABLE permisos_usuario ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's role nivel
CREATE OR REPLACE FUNCTION get_my_rol_nivel()
RETURNS int AS $$
  SELECT r.nivel FROM usuarios u
  JOIN roles r ON r.id = u.rol_id
  WHERE u.id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Roles: readable by all authenticated, writable by nivel <= 2
CREATE POLICY "roles_select" ON roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "roles_insert" ON roles FOR INSERT TO authenticated WITH CHECK (get_my_rol_nivel() <= 2);
CREATE POLICY "roles_update" ON roles FOR UPDATE TO authenticated USING (get_my_rol_nivel() <= 2);
CREATE POLICY "roles_delete" ON roles FOR DELETE TO authenticated USING (get_my_rol_nivel() = 1);

-- Sucursales: readable by all, writable by nivel <= 4
CREATE POLICY "sucursales_select" ON sucursales FOR SELECT TO authenticated USING (true);
CREATE POLICY "sucursales_write"  ON sucursales FOR ALL   TO authenticated USING (get_my_rol_nivel() <= 4);

-- Usuarios: readable by all authenticated
CREATE POLICY "usuarios_select" ON usuarios FOR SELECT TO authenticated USING (true);
-- Insert only by Creador (via service role on invitation)
CREATE POLICY "usuarios_insert" ON usuarios FOR INSERT TO authenticated WITH CHECK (get_my_rol_nivel() = 1);
-- Update own profile fields OR admin update
CREATE POLICY "usuarios_update" ON usuarios FOR UPDATE TO authenticated
  USING (id = auth.uid() OR get_my_rol_nivel() <= 4);
-- Delete only by Creador
CREATE POLICY "usuarios_delete" ON usuarios FOR DELETE TO authenticated USING (get_my_rol_nivel() = 1);

-- Permisos base: readable by all, writable by Creador only
CREATE POLICY "permisos_base_select" ON permisos_base FOR SELECT TO authenticated USING (true);
CREATE POLICY "permisos_base_write"  ON permisos_base FOR ALL   TO authenticated USING (get_my_rol_nivel() = 1);

-- Permisos usuario: readable by the user + admins, writable by Creador only
CREATE POLICY "permisos_usuario_select" ON permisos_usuario FOR SELECT TO authenticated
  USING (usuario_id = auth.uid() OR get_my_rol_nivel() <= 4);
CREATE POLICY "permisos_usuario_write" ON permisos_usuario FOR ALL TO authenticated
  USING (get_my_rol_nivel() = 1);

-- ── INDEXES ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_usuarios_rol       ON usuarios(rol_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_sucursal  ON usuarios(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_permisos_base_rol  ON permisos_base(rol_id, modulo, accion);
CREATE INDEX IF NOT EXISTS idx_permisos_usr_uid   ON permisos_usuario(usuario_id, modulo, accion);
