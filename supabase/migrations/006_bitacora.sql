-- ============================================================
-- PATCH: Tabla bitacora_actividad (requerida por audit middleware)
-- ============================================================

CREATE TABLE IF NOT EXISTS bitacora_actividad (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  modulo     text NOT NULL,
  accion     text NOT NULL,
  metodo     text,
  ruta       text,
  ip         text,
  datos      jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bitacora_actividad ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden leer la bitácora; el backend inserta con service key (bypasa RLS)
CREATE POLICY "bitacora_select" ON bitacora_actividad
  FOR SELECT TO authenticated
  USING (get_my_rol_nivel() <= 3);

CREATE INDEX idx_bitacora_created  ON bitacora_actividad(created_at DESC);
CREATE INDEX idx_bitacora_modulo   ON bitacora_actividad(modulo);
CREATE INDEX idx_bitacora_usuario  ON bitacora_actividad(usuario_id);
