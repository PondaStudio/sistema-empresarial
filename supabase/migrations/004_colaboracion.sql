-- ============================================================
-- Migration 004: Comunicación, RRHH, Tareas, Contrataciones
-- Wave 4
-- ============================================================

-- ── COMUNICACIÓN ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS canales (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre      varchar(150) NOT NULL,
  tipo        varchar(20) NOT NULL DEFAULT 'sucursal'
              CHECK (tipo IN ('sucursal','area','directo','general')),
  sucursal_id uuid REFERENCES sucursales(id),
  creado_por  uuid REFERENCES usuarios(id),
  created_at  timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS miembros_canal (
  canal_id   uuid NOT NULL REFERENCES canales(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  joined_at  timestamptz NOT NULL DEFAULT NOW(),
  PRIMARY KEY (canal_id, usuario_id)
);

CREATE TABLE IF NOT EXISTS mensajes (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  canal_id   uuid NOT NULL REFERENCES canales(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES usuarios(id),
  contenido  text,
  tipo       varchar(20) NOT NULL DEFAULT 'texto'
             CHECK (tipo IN ('texto','nota_voz','imagen','archivo')),
  archivo_url text,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mensajes_canal ON mensajes(canal_id, created_at DESC);

-- ── EMPLEADOS / RRHH ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS empleados (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id      uuid NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
  fecha_ingreso   date,
  tipo_contrato   varchar(50),
  documentos      jsonb DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS asistencia (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  empleado_id      uuid NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
  fecha            date NOT NULL,
  hora_entrada     time,
  hora_salida      time,
  horas_trabajadas numeric(4,2) DEFAULT 0,
  horas_extra      numeric(4,2) DEFAULT 0,
  fuente           varchar(20) DEFAULT 'checador'
                   CHECK (fuente IN ('checador','manual')),
  UNIQUE (empleado_id, fecha)
);

CREATE INDEX IF NOT EXISTS idx_asistencia_empleado ON asistencia(empleado_id, fecha DESC);

CREATE TABLE IF NOT EXISTS vacaciones (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  empleado_id  uuid NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
  fecha_inicio date NOT NULL,
  fecha_fin    date NOT NULL,
  estado       varchar(20) NOT NULL DEFAULT 'pendiente'
               CHECK (estado IN ('pendiente','aprobado','rechazado','cancelado')),
  aprobado_por uuid REFERENCES usuarios(id),
  created_at   timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bonos (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  empleado_id uuid NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
  periodo     varchar(20) NOT NULL,
  monto       numeric(10,2) NOT NULL,
  concepto    text,
  created_at  timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS llamadas_atencion (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  empleado_id    uuid NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
  motivo         text NOT NULL,
  tipo           varchar(20) NOT NULL DEFAULT 'verbal'
                 CHECK (tipo IN ('verbal','escrita','suspension','otro')),
  registrado_por uuid NOT NULL REFERENCES usuarios(id),
  created_at     timestamptz NOT NULL DEFAULT NOW()
);

-- ── CONTRATACIONES ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS candidatos (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre           varchar(200) NOT NULL,
  email            varchar(255),
  telefono         varchar(30),
  puesto_aplicado  varchar(150),
  sucursal_id      uuid REFERENCES sucursales(id),
  estado           varchar(30) NOT NULL DEFAULT 'nuevo'
                   CHECK (estado IN ('nuevo','en_proceso','entrevistado','contratado','rechazado')),
  created_at       timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS entrevistas (
  id                   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidato_id         uuid NOT NULL REFERENCES candidatos(id) ON DELETE CASCADE,
  entrevistador_id     uuid NOT NULL REFERENCES usuarios(id),
  transcripcion        text,
  analisis_psicometrico jsonb,
  puntuacion           numeric(4,2),
  realizada_at         timestamptz NOT NULL DEFAULT NOW()
);

-- ── TAREAS Y CALENDARIO ───────────────────────────────────
CREATE TABLE IF NOT EXISTS tareas (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo       varchar(300) NOT NULL,
  descripcion  text,
  asignada_por uuid NOT NULL REFERENCES usuarios(id),
  asignada_a   uuid NOT NULL REFERENCES usuarios(id),
  sucursal_id  uuid REFERENCES sucursales(id),
  estado       varchar(20) NOT NULL DEFAULT 'pendiente'
               CHECK (estado IN ('pendiente','en_progreso','en_revision','rechazada','completada')),
  fecha_limite timestamptz,
  notas_rechazo text,
  created_at   timestamptz NOT NULL DEFAULT NOW(),
  updated_at   timestamptz NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tareas_updated_at
  BEFORE UPDATE ON tareas
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_tareas_asignada_a  ON tareas(asignada_a, estado);
CREATE INDEX IF NOT EXISTS idx_tareas_asignada_por ON tareas(asignada_por);

CREATE TABLE IF NOT EXISTS subtareas (
  id        uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tarea_id  uuid NOT NULL REFERENCES tareas(id) ON DELETE CASCADE,
  titulo    varchar(300) NOT NULL,
  completada boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS evidencias_tarea (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tarea_id    uuid NOT NULL REFERENCES tareas(id) ON DELETE CASCADE,
  url         text NOT NULL,
  subida_por  uuid NOT NULL REFERENCES usuarios(id),
  created_at  timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comentarios_tarea (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tarea_id    uuid NOT NULL REFERENCES tareas(id) ON DELETE CASCADE,
  usuario_id  uuid NOT NULL REFERENCES usuarios(id),
  contenido   text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS eventos_calendario (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo       varchar(300) NOT NULL,
  descripcion  text,
  creado_por   uuid NOT NULL REFERENCES usuarios(id),
  sucursal_id  uuid REFERENCES sucursales(id),
  inicio       timestamptz NOT NULL,
  fin          timestamptz,
  todo_el_dia  boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT NOW()
);

-- ── ROW LEVEL SECURITY ────────────────────────────────────
ALTER TABLE canales           ENABLE ROW LEVEL SECURITY;
ALTER TABLE miembros_canal    ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensajes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE empleados         ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistencia        ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacaciones        ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE llamadas_atencion ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidatos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE entrevistas       ENABLE ROW LEVEL SECURITY;
ALTER TABLE tareas            ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtareas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidencias_tarea  ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios_tarea ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos_calendario ENABLE ROW LEVEL SECURITY;

-- Canales y mensajes: miembros del canal
CREATE POLICY "canales_select"  ON canales FOR SELECT TO authenticated USING (true);
CREATE POLICY "canales_insert"  ON canales FOR INSERT TO authenticated WITH CHECK (get_my_rol_nivel() <= 8);
CREATE POLICY "miembros_all"    ON miembros_canal FOR ALL TO authenticated USING (true);
CREATE POLICY "mensajes_select" ON mensajes FOR SELECT TO authenticated
  USING (canal_id IN (SELECT canal_id FROM miembros_canal WHERE usuario_id = auth.uid()));
CREATE POLICY "mensajes_insert" ON mensajes FOR INSERT TO authenticated
  WITH CHECK (usuario_id = auth.uid() AND canal_id IN (SELECT canal_id FROM miembros_canal WHERE usuario_id = auth.uid()));

-- RRHH: empleado ve su propio expediente; admins ven todo
CREATE POLICY "empleados_select"   ON empleados  FOR SELECT TO authenticated
  USING (usuario_id = auth.uid() OR get_my_rol_nivel() <= 6);
CREATE POLICY "empleados_write"    ON empleados  FOR ALL TO authenticated USING (get_my_rol_nivel() <= 6);
CREATE POLICY "asistencia_select"  ON asistencia FOR SELECT TO authenticated
  USING (empleado_id IN (SELECT id FROM empleados WHERE usuario_id = auth.uid()) OR get_my_rol_nivel() <= 6);
CREATE POLICY "asistencia_write"   ON asistencia FOR ALL TO authenticated USING (get_my_rol_nivel() <= 6);
CREATE POLICY "vacaciones_select"  ON vacaciones FOR SELECT TO authenticated
  USING (empleado_id IN (SELECT id FROM empleados WHERE usuario_id = auth.uid()) OR get_my_rol_nivel() <= 5);
CREATE POLICY "vacaciones_write"   ON vacaciones FOR ALL TO authenticated USING (get_my_rol_nivel() <= 5);
CREATE POLICY "bonos_select"       ON bonos      FOR SELECT TO authenticated
  USING (empleado_id IN (SELECT id FROM empleados WHERE usuario_id = auth.uid()) OR get_my_rol_nivel() <= 5);
CREATE POLICY "bonos_write"        ON bonos      FOR ALL TO authenticated USING (get_my_rol_nivel() <= 4);
CREATE POLICY "llamadas_select"    ON llamadas_atencion FOR SELECT TO authenticated
  USING (empleado_id IN (SELECT id FROM empleados WHERE usuario_id = auth.uid()) OR get_my_rol_nivel() <= 6);
CREATE POLICY "llamadas_write"     ON llamadas_atencion FOR ALL TO authenticated USING (get_my_rol_nivel() <= 6);

-- Contrataciones: nivel <= 4
CREATE POLICY "candidatos_all"  ON candidatos  FOR ALL TO authenticated USING (get_my_rol_nivel() <= 4);
CREATE POLICY "entrevistas_all" ON entrevistas FOR ALL TO authenticated USING (get_my_rol_nivel() <= 4);

-- Tareas: cada usuario ve las suyas (asignadas a o por ellos) + admins ven todo
CREATE POLICY "tareas_select" ON tareas FOR SELECT TO authenticated
  USING (asignada_a = auth.uid() OR asignada_por = auth.uid() OR get_my_rol_nivel() <= 5);
CREATE POLICY "tareas_insert" ON tareas FOR INSERT TO authenticated WITH CHECK (asignada_por = auth.uid());
CREATE POLICY "tareas_update" ON tareas FOR UPDATE TO authenticated
  USING (asignada_a = auth.uid() OR asignada_por = auth.uid() OR get_my_rol_nivel() <= 5);
CREATE POLICY "subtareas_all"      ON subtareas         FOR ALL TO authenticated USING (true);
CREATE POLICY "evidencias_all"     ON evidencias_tarea  FOR ALL TO authenticated USING (true);
CREATE POLICY "comentarios_all"    ON comentarios_tarea FOR ALL TO authenticated USING (true);
CREATE POLICY "eventos_select"     ON eventos_calendario FOR SELECT TO authenticated USING (true);
CREATE POLICY "eventos_write"      ON eventos_calendario FOR ALL TO authenticated USING (get_my_rol_nivel() <= 8);
