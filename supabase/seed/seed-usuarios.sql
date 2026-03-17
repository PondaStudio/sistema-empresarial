-- =============================================================
-- SEED: Usuarios de prueba (12 roles jerárquicos)
-- Ejecutar en Supabase SQL Editor
-- Password para todos: Empresa2026!
-- =============================================================

-- PASO 1: Crear usuarios en auth.users
-- Nota: usa la función interna de Supabase para crear usuarios con contraseña

SELECT auth.create_user(
  '{"email": "pondaxems@gmail.com", "password": "Empresa2026!", "email_confirm": true, "user_metadata": {"nombre": "Christian Ponda"}}'::jsonb
);
SELECT auth.create_user(
  '{"email": "gerente@empresa.com", "password": "Empresa2026!", "email_confirm": true, "user_metadata": {"nombre": "Roberto García"}}'::jsonb
);
SELECT auth.create_user(
  '{"email": "dueno@empresa.com", "password": "Empresa2026!", "email_confirm": true, "user_metadata": {"nombre": "Carlos Dueño"}}'::jsonb
);
SELECT auth.create_user(
  '{"email": "familiar@empresa.com", "password": "Empresa2026!", "email_confirm": true, "user_metadata": {"nombre": "Ana Familiar"}}'::jsonb
);
SELECT auth.create_user(
  '{"email": "admg2@empresa.com", "password": "Empresa2026!", "email_confirm": true, "user_metadata": {"nombre": "Luis Admin"}}'::jsonb
);
SELECT auth.create_user(
  '{"email": "encargado@empresa.com", "password": "Empresa2026!", "email_confirm": true, "user_metadata": {"nombre": "María Encargada"}}'::jsonb
);
SELECT auth.create_user(
  '{"email": "bodega@empresa.com", "password": "Empresa2026!", "email_confirm": true, "user_metadata": {"nombre": "José Bodega"}}'::jsonb
);
SELECT auth.create_user(
  '{"email": "admg1@empresa.com", "password": "Empresa2026!", "email_confirm": true, "user_metadata": {"nombre": "Pedro Admin"}}'::jsonb
);
SELECT auth.create_user(
  '{"email": "cajera@empresa.com", "password": "Empresa2026!", "email_confirm": true, "user_metadata": {"nombre": "Laura Cajera"}}'::jsonb
);
SELECT auth.create_user(
  '{"email": "almacenista@empresa.com", "password": "Empresa2026!", "email_confirm": true, "user_metadata": {"nombre": "Miguel Almacenista"}}'::jsonb
);
SELECT auth.create_user(
  '{"email": "vendedora@empresa.com", "password": "Empresa2026!", "email_confirm": true, "user_metadata": {"nombre": "Sofia Vendedora"}}'::jsonb
);
SELECT auth.create_user(
  '{"email": "promotor@empresa.com", "password": "Empresa2026!", "email_confirm": true, "user_metadata": {"nombre": "Diego Promotor"}}'::jsonb
);

-- PASO 2: Insertar en public.usuarios usando los UUIDs generados en auth.users
INSERT INTO public.usuarios (id, email, nombre, rol, activo, sucursal_id, created_at)
SELECT
  au.id,
  au.email,
  u.nombre,
  u.rol,
  true,
  NULL,
  NOW()
FROM auth.users au
JOIN (VALUES
  ('pondaxems@gmail.com',   'Christian Ponda',    'creador'),
  ('gerente@empresa.com',   'Roberto García',     'gerente'),
  ('dueno@empresa.com',     'Carlos Dueño',       'supervisor_dueno'),
  ('familiar@empresa.com',  'Ana Familiar',       'supervisor_familiar'),
  ('admg2@empresa.com',     'Luis Admin',         'admin_g2'),
  ('encargado@empresa.com', 'María Encargada',    'encargado_sucursal'),
  ('bodega@empresa.com',    'José Bodega',        'encargado_bodega'),
  ('admg1@empresa.com',     'Pedro Admin',        'admin_g1'),
  ('cajera@empresa.com',    'Laura Cajera',       'cajera'),
  ('almacenista@empresa.com','Miguel Almacenista','almacenista'),
  ('vendedora@empresa.com', 'Sofia Vendedora',    'vendedora'),
  ('promotor@empresa.com',  'Diego Promotor',     'promotor')
) AS u(email, nombre, rol) ON au.email = u.email
ON CONFLICT (id) DO UPDATE SET
  nombre   = EXCLUDED.nombre,
  rol      = EXCLUDED.rol,
  activo   = true;

-- Verificar resultado
SELECT id, email, nombre, rol, activo FROM public.usuarios ORDER BY
  CASE rol
    WHEN 'creador'             THEN 1
    WHEN 'gerente'             THEN 2
    WHEN 'supervisor_dueno'    THEN 3
    WHEN 'supervisor_familiar' THEN 4
    WHEN 'admin_g2'            THEN 5
    WHEN 'encargado_sucursal'  THEN 6
    WHEN 'encargado_bodega'    THEN 7
    WHEN 'admin_g1'            THEN 8
    WHEN 'cajera'              THEN 9
    WHEN 'almacenista'         THEN 10
    WHEN 'vendedora'           THEN 11
    WHEN 'promotor'            THEN 12
    ELSE 99
  END;
