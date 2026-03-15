-- ============================================================
-- WAVE 5: Dashboard, Avisos, Notificaciones, Formatos
-- ============================================================

-- ─── AVISOS GENERALES ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS avisos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo        text NOT NULL,
  contenido     text NOT NULL,
  tipo          text NOT NULL DEFAULT 'info' CHECK (tipo IN ('info','alerta','urgente')),
  activo        boolean NOT NULL DEFAULT true,
  fijado        boolean NOT NULL DEFAULT false,
  sucursal_id   uuid REFERENCES sucursales(id) ON DELETE SET NULL,  -- NULL = todas
  creado_por    uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz
);

ALTER TABLE avisos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "avisos_select" ON avisos FOR SELECT TO authenticated USING (
  activo = true AND (expires_at IS NULL OR expires_at > now())
  AND (sucursal_id IS NULL OR sucursal_id = (
    SELECT sucursal_id FROM usuarios WHERE id = auth.uid()
  ))
);
CREATE POLICY "avisos_insert" ON avisos FOR INSERT TO authenticated WITH CHECK (
  get_my_rol_nivel() <= 4
);
CREATE POLICY "avisos_update" ON avisos FOR UPDATE TO authenticated USING (
  get_my_rol_nivel() <= 4
);
CREATE POLICY "avisos_delete" ON avisos FOR DELETE TO authenticated USING (
  get_my_rol_nivel() <= 2
);

CREATE INDEX idx_avisos_activo ON avisos(activo, fijado, created_at DESC);

-- ─── NOTIFICACIONES ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notificaciones (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id    uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo          text NOT NULL, -- 'tarea', 'pedido', 'mensaje', 'aviso', 'sistema'
  titulo        text NOT NULL,
  cuerpo        text,
  leida         boolean NOT NULL DEFAULT false,
  url           text,          -- ruta interna a la que lleva el click
  referencia_id uuid,          -- id del objeto relacionado (tarea, pedido, etc.)
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_select" ON notificaciones FOR SELECT TO authenticated
  USING (usuario_id = auth.uid());
CREATE POLICY "notif_update" ON notificaciones FOR UPDATE TO authenticated
  USING (usuario_id = auth.uid());
CREATE POLICY "notif_insert" ON notificaciones FOR INSERT TO authenticated
  WITH CHECK (true); -- backend inserts on behalf of users
CREATE POLICY "notif_delete" ON notificaciones FOR DELETE TO authenticated
  USING (usuario_id = auth.uid());

CREATE INDEX idx_notif_usuario ON notificaciones(usuario_id, leida, created_at DESC);

-- ─── FORMATOS / PLANTILLAS ─────────────────────────────────
CREATE TABLE IF NOT EXISTS formatos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre        text NOT NULL,
  categoria     text NOT NULL, -- 'ventas','rrhh','inventario','general'
  descripcion   text,
  url_plantilla text NOT NULL, -- URL en Supabase Storage
  activo        boolean NOT NULL DEFAULT true,
  subido_por    uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE formatos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "formatos_select" ON formatos FOR SELECT TO authenticated
  USING (activo = true);
CREATE POLICY "formatos_insert" ON formatos FOR INSERT TO authenticated
  WITH CHECK (get_my_rol_nivel() <= 3);
CREATE POLICY "formatos_update" ON formatos FOR UPDATE TO authenticated
  USING (get_my_rol_nivel() <= 3);

-- ─── EVALUACIONES DE DESEMPEÑO ─────────────────────────────
CREATE TABLE IF NOT EXISTS evaluaciones (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empleado_id     uuid NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
  evaluador_id    uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  periodo         text NOT NULL,   -- e.g. '2024-Q1'
  puntaje_total   numeric(5,2),
  puntaje_puntualidad numeric(5,2),
  puntaje_calidad     numeric(5,2),
  puntaje_actitud     numeric(5,2),
  comentarios     text,
  estado          text NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador','publicada')),
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE evaluaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "eval_insert" ON evaluaciones FOR INSERT TO authenticated
  WITH CHECK (get_my_rol_nivel() <= 4);
CREATE POLICY "eval_select" ON evaluaciones FOR SELECT TO authenticated
  USING (
    get_my_rol_nivel() <= 4
    OR evaluador_id = auth.uid()
    OR empleado_id IN (SELECT id FROM empleados WHERE usuario_id = auth.uid())
  );
CREATE POLICY "eval_update" ON evaluaciones FOR UPDATE TO authenticated
  USING (get_my_rol_nivel() <= 4 OR evaluador_id = auth.uid());

-- ─── CAPACITACIONES ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS capacitaciones (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo      text NOT NULL,
  descripcion text,
  url_material text,
  obligatoria boolean NOT NULL DEFAULT false,
  activa      boolean NOT NULL DEFAULT true,
  creado_por  uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS capacitaciones_completadas (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  capacitacion_id   uuid NOT NULL REFERENCES capacitaciones(id) ON DELETE CASCADE,
  usuario_id        uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  completada_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE(capacitacion_id, usuario_id)
);

ALTER TABLE capacitaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE capacitaciones_completadas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cap_select" ON capacitaciones FOR SELECT TO authenticated USING (activa = true);
CREATE POLICY "cap_insert" ON capacitaciones FOR INSERT TO authenticated WITH CHECK (get_my_rol_nivel() <= 3);
CREATE POLICY "cap_completadas_select" ON capacitaciones_completadas FOR SELECT TO authenticated
  USING (usuario_id = auth.uid() OR get_my_rol_nivel() <= 4);
CREATE POLICY "cap_completadas_insert" ON capacitaciones_completadas FOR INSERT TO authenticated
  WITH CHECK (usuario_id = auth.uid());
