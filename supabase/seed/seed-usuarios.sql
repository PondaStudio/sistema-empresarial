-- =============================================================
-- SEED: Usuarios de prueba (12 roles jerárquicos)
-- Ejecutar en Supabase SQL Editor
-- Password para todos: Empresa2026!
-- =============================================================

-- PASO 0: Verificar estructura de la tabla
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'usuarios'
ORDER BY ordinal_position;

-- PASO 1: Insertar en auth.users
-- (Omite emails que ya existan para evitar duplicados)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  role,
  aud
)
SELECT
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  u.email,
  crypt('Empresa2026!', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  'authenticated',
  'authenticated'
FROM (VALUES
  ('pondaxems@gmail.com'),
  ('gerente@empresa.com'),
  ('dueno@empresa.com'),
  ('familiar@empresa.com'),
  ('admg2@empresa.com'),
  ('encargado@empresa.com'),
  ('bodega@empresa.com'),
  ('admg1@empresa.com'),
  ('cajera@empresa.com'),
  ('almacenista@empresa.com'),
  ('vendedora@empresa.com'),
  ('promotor@empresa.com')
) AS u(email)
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users au WHERE au.email = u.email
);

-- PASO 2: Insertar en public.usuarios (solo los que no existen ya)
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
  ('pondaxems@gmail.com',    'Christian Ponda',     'creador'),
  ('gerente@empresa.com',    'Roberto García',      'gerente'),
  ('dueno@empresa.com',      'Carlos Dueño',        'supervisor_dueno'),
  ('familiar@empresa.com',   'Ana Familiar',        'supervisor_familiar'),
  ('admg2@empresa.com',      'Luis Admin',          'admin_g2'),
  ('encargado@empresa.com',  'María Encargada',     'encargado_sucursal'),
  ('bodega@empresa.com',     'José Bodega',         'encargado_bodega'),
  ('admg1@empresa.com',      'Pedro Admin',         'admin_g1'),
  ('cajera@empresa.com',     'Laura Cajera',        'cajera'),
  ('almacenista@empresa.com','Miguel Almacenista',  'almacenista'),
  ('vendedora@empresa.com',  'Sofia Vendedora',     'vendedora'),
  ('promotor@empresa.com',   'Diego Promotor',      'promotor')
) AS u(email, nombre, rol) ON au.email = u.email
WHERE NOT EXISTS (
  SELECT 1 FROM public.usuarios pu WHERE pu.id = au.id
);

-- PASO 3: Verificar resultado
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
