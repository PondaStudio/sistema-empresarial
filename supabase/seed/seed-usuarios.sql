-- =============================================================
-- SEED: Usuarios de prueba (12 roles jerárquicos)
-- Ejecutar en Supabase SQL Editor
-- Password para todos: Empresa2026!
-- =============================================================

-- PASO 1: Insertar en auth.users
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
VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'pondaxems@gmail.com',   crypt('Empresa2026!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'gerente@empresa.com',   crypt('Empresa2026!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'dueno@empresa.com',     crypt('Empresa2026!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'familiar@empresa.com',  crypt('Empresa2026!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'admg2@empresa.com',     crypt('Empresa2026!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'encargado@empresa.com', crypt('Empresa2026!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'bodega@empresa.com',    crypt('Empresa2026!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'admg1@empresa.com',     crypt('Empresa2026!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'cajera@empresa.com',    crypt('Empresa2026!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'almacenista@empresa.com', crypt('Empresa2026!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'vendedora@empresa.com', crypt('Empresa2026!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'promotor@empresa.com',  crypt('Empresa2026!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
ON CONFLICT (email) DO NOTHING;

-- PASO 2: Insertar en public.usuarios usando los UUIDs de auth.users
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
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  rol    = EXCLUDED.rol,
  activo = true;

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
