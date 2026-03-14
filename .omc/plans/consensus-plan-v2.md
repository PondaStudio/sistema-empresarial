# Consensus Plan v2 — Sistema Empresarial Completo

## ADR (Architecture Decision Record)

### Decision
Monorepo con Express como único API gateway público, FastAPI como servicio interno.
Hosting en Render (un solo servicio con Procfile multi-proceso).
Schema en 5 waves validadas por código antes de avanzar a la siguiente.

### Drivers
1. URL activa en Render — no duplicar infraestructura
2. Single auth point — Express valida JWT antes de delegar a FastAPI
3. Schema incremental — cada wave validada antes de la siguiente

### Alternatives Considered
- Railway — descartado (Render ya activo con URL real)
- Repos separados — descartado (tipos compartidos, un solo CI/CD)
- FastAPI gateway directo — descartado (duplica auth, complica CORS)
- Schema completo upfront — descartado (churn garantizado en módulos 15-27)

### Consequences
- Express añade latencia a llamadas Python (~5ms aceptable para análisis)
- Procfile en Render requiere plan que soporte múltiples procesos
- Waves obligan a respetar FK ordering estricto

### Follow-ups
- Evaluar WebRTC provider (wave 4)
- Rotar claves Supabase si están en git history
- Decidir Recharts vs Chart.js antes de Wave 3 frontend

---

## Estructura de Carpetas (Tarea 0)

```
sistema-empresarial/
├── frontend/
│   ├── src/
│   │   ├── components/ui/        # componentes base (Button, Input, Modal, etc.)
│   │   ├── components/layout/    # Sidebar, Navbar, ThemeToggle
│   │   ├── pages/                # una carpeta por módulo
│   │   ├── hooks/                # useAuth, usePermissions, useRealtime
│   │   ├── store/                # Zustand stores por módulo
│   │   ├── services/             # api.ts, supabase.ts, fcm.ts
│   │   └── types/                # tipos compartidos con backend
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── routes/               # una carpeta por módulo
│   │   ├── controllers/          # lógica de cada endpoint
│   │   ├── middleware/           # auth.ts, permissions.ts, audit.ts, rateLimit.ts
│   │   ├── services/             # lógica de negocio + llamadas a FastAPI
│   │   ├── utils/                # helpers, validators
│   │   └── types/                # tipos compartidos
│   ├── app.ts
│   ├── server.ts
│   ├── tsconfig.json
│   └── package.json
├── analysis/
│   ├── app/
│   │   ├── routers/              # un router por script/módulo
│   │   ├── services/             # lógica de análisis
│   │   ├── models/               # Pydantic models
│   │   └── utils/                # helpers OCR, scraping, etc.
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── supabase/
│   ├── migrations/               # archivos SQL numerados (Supabase CLI)
│   └── seed/                     # datos iniciales (roles, sucursales, etc.)
├── docs/
│   └── er-diagram.md             # Mermaid ER diagram completo
├── Procfile                      # web: node backend/dist/server.js
                              # analysis: uvicorn analysis.main:app --port 8001
├── .env.example
├── CLAUDE.md
└── README.md
```

---

## TAREA 0: ER Diagram Completo (GATE — debe existir antes de Wave 1)

**Deliverable:** `docs/er-diagram.md` con diagrama Mermaid completo.
**Review gate:** Todas las FKs verificadas antes de generar migrations.
**Tablas principales (27 módulos → ~45 tablas):**

Grupo Auth/Core: roles, permisos_base, permisos_usuario, sucursales, usuarios, estados_presencia
Grupo Productos: productos, categorias, familias, inventario, movimientos_inventario, mermas
Grupo Proveedores: proveedores, productos_proveedor, pedidos_proveedor, items_pedido_proveedor
Grupo Clientes: clientes_frecuentes, domicilios_cliente, datos_fiscales_cliente
Grupo Pedidos: pedidos_venta, items_pedido_venta, confirmaciones_almacenista
Grupo Facturación: facturas, comprobantes_factura
Grupo Paqueterías: paqueterias, envios
Grupo RRHH: empleados, asistencia, vacaciones, bonos, llamadas_atencion, expedientes
Grupo Contrataciones: candidatos, entrevistas, analisis_psicometrico
Grupo Tareas: tareas, subtareas, evidencias_tarea, comentarios_tarea, eventos_calendario
Grupo Comunicación: canales, miembros_canal, mensajes, archivos_mensaje
Grupo Sistema: bitacora_actividad, notificaciones, notificaciones_usuario, avisos
Grupo Comercial: promociones, descuentos, precios_especiales, garantias_devoluciones
Grupo Capacitación: cursos, asignaciones_curso, progreso_curso
Grupo Evaluaciones: evaluaciones_desempeno, criterios_evaluacion

---

## TAREA PRE-WAVE: Diseño del Sistema de Permisos (GATE antes de Wave 2)

**Problema:** Matriz Rol × Acción × Módulo = 11 × 7 × 27 = 2,079 celdas + overrides individuales.
**Deliverables:**
1. `supabase/seed/permissions_matrix.sql` — seed con los 2,079 valores por defecto por rol
2. Schema de tablas:
   - `roles(id, nombre, nivel, descripcion)`
   - `permisos_base(rol_id, modulo, accion, habilitado)` — defaults por rol
   - `permisos_usuario(usuario_id, modulo, accion, habilitado)` — overrides individuales
3. Express middleware `src/middleware/permissions.ts`:
   - `checkPermission(modulo, accion)` — verifica permisos del usuario autenticado
   - Usa cache Redis/in-memory con invalidación via Supabase Realtime
4. Supabase Realtime subscription: canal `permissions_updates` para invalidar cache en tiempo real

**Acciones por módulo:**
- VER, CREAR, EDITAR, ELIMINAR, EXPORTAR, APROBAR, IMPRIMIR

**Regla core (enforcement en DB + middleware):**
- Un usuario no puede modificar permisos de alguien con nivel ≤ al suyo

---

## TAREA PRE-WAVE: Contrato Express↔FastAPI

**Base URL interna:** `http://localhost:8001` (mismo servidor Render, Procfile)
**Autenticación:** Header `X-Internal-Key: <INTERNAL_SECRET>` (env var compartida)
**Formato de error:**
```json
{"error": "string", "code": "ANALYSIS_ERROR|OCR_ERROR|AI_ERROR", "detail": "string"}
```

**Endpoints FastAPI por módulo:**
- `POST /analysis/ventas` — análisis de ventas (recibe Excel/CSV procesado)
- `POST /analysis/productos` — comparación de productos
- `POST /analysis/predicciones` — proyecciones históricas
- `POST /analysis/bonos` — cálculo de bonos
- `POST /analysis/horas-extras` — horas extras del checador
- `POST /ocr/documento` — extracción Google Vision API
- `POST /ai/entrevista/sugerencias` — sugerencias en tiempo real (Anthropic)
- `POST /ai/entrevista/analisis` — análisis psicométrico final
- `GET /scraping/catalogo` — trigger web scraping semanal

---

## TAREA PRE-WAVE: WebRTC Spike (prerequisito Módulo 9)

**Decisión requerida antes de Wave 4:**
- Opción A: LiveKit (self-hosted en Render) — control total, costo fijo
- Opción B: Daily.co — managed, costo por minuto
- Opción C: simple-peer + servidor de señalización custom

**Deliverable del spike:** `docs/webrtc-decision.md` con opción elegida, costo estimado, integración con Express.

---

## WAVE 1: Auth + Permisos + Usuarios + Sucursales

### Schema (migration 001_core.sql)
```sql
-- roles, permisos_base, permisos_usuario, sucursales, usuarios, estados_presencia
-- RLS policies para cada tabla
-- Triggers: audit log, updated_at
```

### Backend Endpoints
```
POST   /auth/invite          — Creador crea cuenta (envía magic link)
POST   /auth/login           — email + password
POST   /auth/logout
GET    /auth/me
PATCH  /users/:id/profile    — solo foto + estado_presencia por el mismo usuario
PATCH  /users/:id/admin      — campos admin (puesto, sucursal) — roles altos
GET    /users                — lista con filtros (rol, sucursal)
GET    /sucursales
POST   /sucursales           — solo Creador/Gerente
GET    /permisos/me          — permisos del usuario actual
PATCH  /permisos/:userId     — override individual (solo Creador)
```

### Frontend
- `/login` — formulario email/password
- `/perfil` — vista del perfil propio (editable: foto, estado_presencia)
- `/admin/usuarios` — lista y gestión (admin)
- `/admin/permisos` — matrix visual de permisos por rol/usuario

### Tests
- Auth middleware rechaza tokens inválidos
- Permisos: rol 8 no puede ver módulos de rol 4
- Override individual funciona en tiempo real (Supabase Realtime)

---

## WAVE 2: Productos + Inventario + Proveedores + Catálogo

### Schema (migration 002_productos.sql)
```sql
-- productos, categorias, familias, inventario, movimientos_inventario, mermas
-- proveedores, productos_proveedor
-- RLS: inventario visible según sucursal del usuario
```

### Backend Endpoints
```
GET    /productos             — con filtros (categoría, búsqueda, sucursal)
POST   /productos
PATCH  /productos/:id
GET    /inventario            — por sucursal
PATCH  /inventario/:id        — ajuste manual
GET    /inventario/alertas    — stock bajo por sucursal
POST   /inventario/mermas
GET    /proveedores           — solo Creador + Gerente
POST   /proveedores
PATCH  /proveedores/:id
POST   /catalogo/sync         — trigger web scraping manual
POST   /inventario/import-cedis — importa Excel/CSV diario del CEDIS (cron o manual)
GET    /inventario/import-cedis/status — estado del último import
```

### FastAPI
- `GET /scraping/catalogo` — scraping semanal actualización productos sin precio

### Tests
- Alerta stock mínimo se dispara correctamente
- Merma registra movimiento_inventario
- Catálogo no muestra precios

---

## WAVE 3: Pedidos + Clientes + Facturación + Paqueterías + Precios + Garantías

### Schema (migration 003_ventas.sql)
```sql
-- pedidos_venta, items_pedido_venta, confirmaciones_almacenista
-- pedidos_proveedor, items_pedido_proveedor
-- clientes_frecuentes, domicilios_cliente, datos_fiscales_cliente
-- facturas, envios, paqueterias, precios_especiales, garantias_devoluciones
```

### Backend Endpoints (Pedidos — flujo 12 pasos)
```
POST   /pedidos/venta                         — vendedora crea pedido
GET    /pedidos/venta/:id
PATCH  /pedidos/venta/:id/items/:itemId       — almacenista confirma/rechaza item
POST   /pedidos/venta/:id/imprimir            — solo cuando todos confirmados
PATCH  /pedidos/venta/:id/surtir              — almacenista confirma surtido
PATCH  /pedidos/venta/:id/escanear-vendedora  — vendedora verifica completo
PATCH  /pedidos/venta/:id/checador            — checador escanea celular
PATCH  /pedidos/venta/:id/puerta              — personal puerta cierra pedido
GET    /pedidos/proveedor
POST   /pedidos/proveedor
PATCH  /pedidos/proveedor/:id/recibir        — actualiza inventario automático
```

### Tests
- Vendedora no puede imprimir hasta todos los items confirmados
- Recepción proveedor actualiza inventario automáticamente
- Flujo completo 12 pasos en orden correcto

---

## WAVE 4: Comunicación + RRHH + Tareas + Calendario

### Schema (migration 004_colaboracion.sql)
```sql
-- canales, miembros_canal, mensajes, archivos_mensaje
-- empleados, asistencia, vacaciones, bonos, llamadas_atencion, expedientes
-- tareas, subtareas, evidencias_tarea, comentarios_tarea, eventos_calendario
-- contrataciones, candidatos, entrevistas
```

### Backend Endpoints críticos
```
-- COMUNICACIÓN
POST   /canales
POST   /canales/:id/mensajes
POST   /canales/:id/notas-voz    — upload audio
GET    /canales/:id/historial
WS     /ws/canales/:id           — Supabase Realtime + WebRTC signaling

-- RRHH
POST   /rrhh/asistencia/import   — importa CSV del checador
GET    /rrhh/asistencia/:empleadoId
POST   /rrhh/vacaciones
PATCH  /rrhh/vacaciones/:id/aprobar
GET    /rrhh/bonos/:periodo
POST   /rrhh/llamadas-atencion

-- TAREAS
POST   /tareas
PATCH  /tareas/:id/estado        — Pendiente→En progreso→En revisión→Completada/Rechazada
POST   /tareas/:id/evidencias    — upload fotos
POST   /tareas/:id/comentarios
```

### WebRTC Spike (debe estar decidido antes de esta wave)

### FastAPI
- `POST /ai/entrevista/sugerencias`
- `POST /ai/entrevista/analisis`

---

## WAVE 5: Dashboard + Análisis + OCR + Notificaciones + Avisos + Bitácora + Módulos restantes

### Módulos restantes
- Dashboard personalizable (widgets por rol, rangos de tiempo, exportación)
- Análisis de datos (conexión a FastAPI scripts)
- OCR / Escaneo (Google Vision API)
- Notificaciones (FCM + in-app Supabase Realtime)
- Avisos Generales
- Bitácora de Actividad
- Capacitación
- Evaluaciones de Desempeño
- Promociones y Descuentos
- Formatos (plantillas)
- Mapa de Sucursales

---

## Estrategia de Testing

### Frameworks
- **Backend:** Vitest + Supertest (endpoints) + Supabase test client
- **Frontend:** Vitest + React Testing Library
- **E2E:** Playwright (flujos críticos: login, pedido completo, permisos)
- **Analysis:** pytest

### Cobertura mínima
- Middleware auth/permisos: 100%
- Flujos críticos (pedido 12 pasos, permisos en tiempo real): 90%
- CRUD endpoints: 80%
- Frontend components: 70%

### Integration checkpoints
1. Después de Wave 1: login completo + permisos en tiempo real
2. Después de Wave 2: vendedora crea pedido + almacenista confirma
3. Después de Wave 3: pedido completo 12 pasos end-to-end
4. Después de Wave 4: mensaje en canal + tarea con evidencia
5. Después de Wave 5: dashboard con datos reales + notificación push

---

## CI/CD

- **Branch strategy:** `main` (producción), `dev` (integración), `feat/modulo-N` (desarrollo)
- **Deploy:** Render auto-deploy desde `main`
- **GitHub Actions:** lint + tests en cada PR a `main`
- **Commit por módulo:** merge de `feat/modulo-N` → `dev` → PR a `main` tras pasar tests

---

## Configuración de Seguridad

- Rate limiting: `express-rate-limit` (100 req/min por IP)
- CORS: solo origen Hostinger configurado
- Helmet.js para headers de seguridad
- Supabase RLS en TODAS las tablas
- Logs: estructura JSON a Render logs
- Variables de entorno: `.env.example` documentado, nunca `.env` en git

---

## Acceptance Criteria Testables (Wave 1 — ejemplo granular)

- [ ] `POST /auth/invite` con email válido → usuario recibe magic link en < 30s
- [ ] Token expirado → 401 con mensaje `TOKEN_EXPIRED`
- [ ] Usuario rol 8 llama `GET /admin/usuarios` → 403 con mensaje `FORBIDDEN`
- [ ] Creador cambia permiso VER módulo inventario para usuario X → cambio reflejado en frontend de X en < 2s (Realtime)
- [ ] Usuario intenta cambiar email → 400 con mensaje `EMAIL_READONLY`
- [ ] Foto de perfil upload → visible en < 5s, guardada en Supabase Storage

---

## Decisiones Pendientes (requieren respuesta del usuario)

1. **WebRTC para audio:** LiveKit self-hosted vs Daily.co managed vs custom signaling?
2. **Charting library:** ¿Recharts o Chart.js? (elegir uno antes de Wave 5 frontend)
3. **PWA vs Web simple:** FCM push en móvil requiere service worker (PWA). ¿Se confirma?
4. **Claves Supabase en git history:** ¿Ya fueron rotadas?
