-- =============================================================
-- SEED: Usuarios de prueba (12 roles jerárquicos)
-- Ejecutar en Supabase SQL Editor
-- Password para todos: Empresa2026!
-- =============================================================
-- Estructura real de public.usuarios:
--   id, nombre, email, rol_id (FK → roles), sucursal_id,
--   estado_presencia, foto_url, activo, created_at, updated_at
-- =============================================================

-- PASO 1: Insertar en auth.users (omite emails que ya existan)
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

-- PASO 2: Insertar en public.usuarios usando rol_id desde tabla roles
INSERT INTO public.usuarios (id, nombre, email, rol_id, sucursal_id, activo, created_at, updated_at)
SELECT
  au.id,
  u.nombre,
  au.email,
  r.id AS rol_id,
  NULL,
  true,
  NOW(),
  NOW()
FROM auth.users au
JOIN (VALUES
  ('pondaxems@gmail.com',    'Christian Ponda',     'Creador'),
  ('gerente@empresa.com',    'Roberto García',      'Gerente General'),
  ('dueno@empresa.com',      'Carlos Dueño',        'Supervisor Dueño'),
  ('familiar@empresa.com',   'Ana Familiar',        'Supervisor Familiar'),
  ('admg2@empresa.com',      'Luis Admin',          'Administrador G2'),
  ('encargado@empresa.com',  'María Encargada',     'Encargado de Sucursal'),
  ('bodega@empresa.com',     'José Bodega',         'Encargado de Bodega'),
  ('admg1@empresa.com',      'Pedro Admin',         'Administrador G1'),
  ('cajera@empresa.com',     'Laura Cajera',        'Cajeras'),
  ('almacenista@empresa.com','Miguel Almacenista',  'Almacenistas G1'),
  ('vendedora@empresa.com',  'Sofia Vendedora',     'Vendedoras'),
  ('promotor@empresa.com',   'Diego Promotor',      'Promotores de Marca')
) AS u(email, nombre, rol_nombre) ON au.email = u.email
JOIN public.roles r ON r.nombre = u.rol_nombre
WHERE NOT EXISTS (
  SELECT 1 FROM public.usuarios pu WHERE pu.id = au.id
);

-- PASO 3: Verificar resultado
SELECT u.nombre, u.email, r.nombre AS rol, r.nivel, u.activo
FROM public.usuarios u
JOIN public.roles r ON r.id = u.rol_id
ORDER BY r.nivel;
