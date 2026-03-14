# Deep Interview Spec: Sistema Empresarial Completo

## Metadata
- Interview ID: si-emp-001
- Rounds: 4
- Final Ambiguity Score: 13.9%
- Type: greenfield
- Generated: 2026-03-14
- Threshold: 20%
- Status: PASSED

## Clarity Breakdown
| Dimensión | Score | Peso | Ponderado |
|-----------|-------|------|-----------|
| Claridad de Meta | 0.93 | 40% | 0.372 |
| Claridad de Restricciones | 0.88 | 30% | 0.264 |
| Criterios de Éxito | 0.75 | 30% | 0.225 |
| **Claridad Total** | | | **0.861** |
| **Ambigüedad** | | | **13.9%** |

---

## Goal

Construir una **Plataforma de Administración Empresarial** completa con 27 módulos interconectados para una empresa de distribución/retail con 5 sucursales y ~50 usuarios. El sistema NO entrará en producción hasta que todos los módulos estén completos y funcionales. La plataforma centraliza operaciones de ventas, inventario, comunicación interna, RRHH, facturación, logística y análisis de datos.

---

## Stack Tecnológico

| Capa | Tecnología | Propósito |
|------|-----------|-----------|
| Frontend | React + Vite + TailwindCSS | Interfaz web responsive (PC, celular, tablet) |
| Gráficas | Recharts / Chart.js | Dashboards y reportes visuales |
| Backend principal | Node.js + Express | API REST, lógica de negocio, autenticación |
| Microservicio análisis | Python + FastAPI | Scripts de análisis e IA |
| Base de datos | Supabase (PostgreSQL) | Datos, auth, realtime, storage |
| Realtime | Supabase Realtime + WebSockets | Comunicación tipo Discord, notificaciones en vivo |
| Hosting frontend | Hostinger Business | Despliegue del build compilado |
| Hosting backend | Railway | Node.js + FastAPI con procesos persistentes |
| OCR / Visión | Google Vision API | Escaneo y extracción de documentos |
| IA Contrataciones | Anthropic API + Google API | Entrevistas inteligentes y análisis psicométrico |
| Notificaciones push | Firebase Cloud Messaging | Alertas en celular |
| Idioma | Español | Único idioma de la plataforma |
| Tema | Claro / Oscuro | Elección del usuario |

---

## Escala y Contexto

- **Sucursales**: 5 sucursales activas + 1 CEDIS (bodega central con sistema propio — no administrado por este sistema)
- **Usuarios**: ~50 usuarios concurrentes
- **Integración CEDIS**: El CEDIS tiene un sistema externo (posiblemente CONTPAQi) que exporta datos diarios en formato Excel/CSV. Este sistema los importa automáticamente (inventario, ventas).
- **Go-live**: El sistema se lanza completo — sin módulos parciales en producción.

---

## Jerarquía de Roles (11 niveles)

| Nivel | Rol | Descripción |
|-------|-----|-------------|
| 1 | Creador | Acceso absoluto. Único que gestiona roles nivel 2. |
| 2 | Gerente General | Acceso total operativo. |
| 3A | Supervisor Dueño | Acceso limitado, configurado por Creador. |
| 3B | Supervisor Familiar | Más limitado que 3A. |
| 4 | Administrador G2 | Casi al nivel del Gerente General. |
| 5 | Encargado de Sucursal | Administra su sucursal. |
| 6 | Encargado de Bodega (Almacenista G2) | Gestiona inventario y surtido. |
| 7 | Administrador G1 | Permisos diferenciados. |
| 8 | Cajeras | Operación de caja y atención. |
| 9 | Almacenistas G1 | Bodega y piso (subtipos: Repartidor, Almacenista de piso, Checador). |
| 10 | Vendedoras | Atención y venta (subtipos: Vendedora, Cajera-vendedora). |
| 11 | Promotores de Marca | Nivel base. Promoción de productos. |

**Regla core**: Ningún rol puede asignar permisos sobre alguien de mayor rango.

---

## Sistema de Permisos

- Matriz **Rol × Acción × Módulo** (similar a CONTPAQi/Discord)
- Permisos base por rol + ajuste individual por Creador
- Tipos de acciones: Ver/Leer, Crear/Agregar, Editar/Modificar, Eliminar, Exportar, Aprobar/Rechazar, Imprimir
- Cambios en **tiempo real** sin reiniciar el sistema

---

## Los 27 Módulos

### Alta Prioridad

| # | Módulo | Complejidad | Notas clave |
|---|--------|-------------|-------------|
| 1 | Login y Perfiles | Media | Invitación solo por Creador. Sin cambio de email/contraseña por usuario. 5 estados de presencia. |
| 2 | Sistema de Permisos Granulares | Alta | Matriz Rol×Acción×Módulo. Tiempo real. |
| 3 | Dashboard | Alta | Personalizable por rol e individualmente. Widgets, rangos de tiempo, exportación. |
| 4 | Análisis de Datos (Python/FastAPI) | Alta | Scripts existentes + nuevos. Import diario Excel/CSV desde CEDIS. |
| 6 | Pedidos de Venta al Cliente | Alta | Flujo 12 pasos: Vendedora → Almacenista → Confirmación → Caja → Checador → Puerta. Sin verificación automática de stock. |
| 7 | Pedidos a Proveedores / CEDIS | Media | Seguimiento logístico, actualización automática al recibir. |
| 8 | Control de Inventario con IA | Alta | Multi-sucursal, alertas stock mínimo, mermas, inventario físico periódico, sugerencias IA. |
| 9 | Comunicación tipo Discord | Alta | Canales por sucursal/área, audio en tiempo real, notas de voz, jerarquía en canales, historial completo. |
| 10 | Recursos Humanos | Media | Asistencia por import del checador, vacaciones, bonos, llamadas de atención, expediente digital. |
| 18 | Avisos Generales | Baja | Por sucursal o global, notificación push + in-app, archivos adjuntos. |
| 20 | Bitácora de Actividad | Baja | Auditable por jerarquía alta, filtrable por usuario/módulo/fecha/acción. |
| 27 | Notificaciones | Media | FCM push + in-app realtime. Tipos: stock, tareas, mensajes, avisos, calendario. |

### Prioridad Media

| # | Módulo | Complejidad | Notas clave |
|---|--------|-------------|-------------|
| 5 | OCR / Escaneo de Documentos | Alta | Google Vision API. Facturas, notas, códigos, cualquier doc. Salida a Excel/texto. |
| 11 | Tareas y Calendario (Notion) | Alta | Flujo: Pendiente → En progreso → En revisión → Rechazada/Completada. Evidencia con fotos. Vistas: lista, kanban, calendario, por persona. |
| 12 | Facturación | Baja | Datos fiscales del cliente, foto ticket, foto comprobante. Datos guardados en perfil cliente. |
| 13 | Paqueterías | Media | Paqueterías configurables, hoja de envío imprimible, autorización jerárquica. |
| 14 | Clientes Frecuentes | Media | Historial compras, múltiples domicilios, paqueterías preferidas, datos fiscales. |
| 15 | Capacitación | Media | Cursos asignados por jefes, videos/manuales, seguimiento de progreso. |
| 16 | Evaluaciones de Desempeño | Media | Jefe→Empleado, entre pares, autoevaluación. Llamadas de atención vinculadas a RRHH. |
| 17 | Promociones y Descuentos | Media | Solo admins altos crean. Vendedoras ven y descargan material promocional. |
| 19 | Gestión de Proveedores | Media | Solo Creador y Gerente General. Catálogo, historial, documentos, vinculado a análisis. |
| 20 | Contrataciones con IA | Alta | Gestión candidatos, entrevista con reconocimiento facial/voz (Google API), sugerencias en tiempo real (Anthropic API), análisis psicométrico. |
| 22 | Catálogo de Productos | Media | Sin precios. Actualización semanal por web scraping. Vinculado a inventario y pedidos. |
| 23 | Formatos | Baja | Plantillas reutilizables (etiquetas, hojas de pedido, etc.). Impresión directa. |
| 25 | Garantías y Devoluciones | Media | Registro, seguimiento, historial por producto y cliente. |
| 26 | Gestión de Precios | Media | Listas de precios, precios especiales por cliente, historial de cambios. |

### Baja Prioridad

| # | Módulo | Complejidad | Notas clave |
|---|--------|-------------|-------------|
| 24 | Mapa de Sucursales | Baja | Info de sucursales, horarios, áreas internas, vista de mapa. |

---

## Constraints

- Todos los módulos deben estar completos antes del go-live (el cliente no usará versiones parciales)
- El CEDIS opera con sistema externo — la integración es vía importación diaria de Excel/CSV (no API directa)
- Integración con CONTPAQi es futura (no requerida en v1.0)
- Las cuentas de usuario las crea exclusivamente el Creador — sin auto-registro
- Los usuarios NO pueden cambiar su email ni contraseña
- El sistema corre en español únicamente
- ~50 usuarios concurrentes, 5 sucursales (escala mediana, Supabase Pro suficiente)
- Audio en tiempo real en comunicación tipo Discord (WebSockets, posiblemente WebRTC)
- Web scraping semanal para actualización del catálogo de productos
- Firebase Cloud Messaging para notificaciones push en móvil

## Non-Goals

- Auto-registro de usuarios (solo invitación por Creador)
- Integración directa con CONTPAQi en v1.0
- e-commerce público para clientes finales
- Punto de Venta (POS) físico con hardware dedicado
- Módulo de contabilidad completo
- Gestión del CEDIS (tiene su propio sistema)
- Multi-idioma (solo español)

---

## Acceptance Criteria

- [ ] Login funciona con email/contraseña, cuentas creadas solo por Creador
- [ ] Sistema de permisos granulares aplica cambios en tiempo real sin reiniciar
- [ ] Dashboard muestra widgets personalizados por rol con datos en tiempo real
- [ ] Análisis de datos importa y procesa archivos Excel/CSV del CEDIS diariamente
- [ ] Flujo completo de pedido de venta (12 pasos) funciona sin verificación automática de stock
- [ ] Pedidos a proveedor se siguen hasta recepción y actualizan inventario automáticamente
- [ ] Inventario refleja multi-sucursal con alertas de stock mínimo configurables
- [ ] Comunicación tipo Discord: canales por sucursal/área, audio en tiempo real, historial completo
- [ ] RRHH importa reporte de checador, calcula horas extras y bonos automáticamente
- [ ] Tareas: flujo completo Pendiente→En revisión→Completada con evidencia fotográfica
- [ ] Facturación guarda datos fiscales en perfil de cliente para reutilización
- [ ] Paqueterías genera hoja de envío imprimible con autorización jerárquica
- [ ] OCR extrae datos de facturas y documentos vía Google Vision API
- [ ] Contrataciones: entrevista con IA incluye reconocimiento facial/voz y análisis psicométrico
- [ ] Notificaciones push llegan vía FCM en dispositivos móviles
- [ ] Bitácora registra todas las acciones del sistema, auditable y filtrable
- [ ] Tema claro/oscuro funcional en toda la plataforma
- [ ] Sistema funciona en PC, celular y tablet (responsive)
- [ ] Los 27 módulos están completos y funcionales antes del go-live

---

## Assumptions Exposed & Resolved

| Asunción | Cuestionamiento | Resolución |
|----------|----------------|------------|
| Sistema multi-sucursal complejo | ¿Cuántas sucursales? | 5 sucursales + 1 CEDIS externo. Escala mediana. |
| Tipo de negocio | ¿Distribuidora o retail? | Híbrido: distribuye a negocios (B2B) y vende directamente (B2C) |
| MVP por módulos | ¿Hay módulos prioritarios para lanzar primero? | No — el sistema es un todo. Go-live solo cuando esté 100% completo. |
| Integración con CEDIS | ¿API directa o importación? | Importación diaria de Excel/CSV. Integración CONTPAQi en futuro. |
| Verificación automática de stock en pedidos | ¿El sistema verifica existencias? | NO — los Almacenistas verifican físicamente. El sistema solo registra su respuesta. |

---

## Ontología (Entidades Principales)

| Entidad | Campos clave | Relaciones |
|---------|-------------|------------|
| Usuario | id, nombre, email, foto, puesto, sucursal, rol, estado_presencia | → Sucursal, Rol, Permisos |
| Sucursal | id, nombre, dirección, horarios, áreas_internas | → Usuarios, Inventario, Pedidos, Canales |
| Pedido_Venta | id, cliente_id, sucursal_id, productos[], estado, vendedora_id | → Cliente, Productos, Almacenista, Checador |
| Pedido_Proveedor | id, proveedor_id, productos[], fecha_solicitud, fecha_estimada, estado | → Proveedor, Inventario |
| Producto | id, código, nombre, categoría, foto, familia | → Inventario, Pedidos, Precios, Catálogo |
| Inventario | id, producto_id, sucursal_id, cantidad, stock_mínimo | → Producto, Sucursal |
| Cliente_Frecuente | id, nombre, domicilios[], datos_fiscales, historial_compras[] | → Pedidos, Facturación, Paqueterías |
| Empleado | id, usuario_id, expediente, asistencia[], bonos[], llamadas_atención[] | → RRHH, Evaluaciones, Tareas |
| Tarea | id, asignada_por, asignada_a, estado, evidencias[], comentarios[] | → Usuarios, Calendario |
| Canal_Comunicación | id, tipo, sucursal_id/área_id, miembros[], historial_mensajes[] | → Usuarios, Mensajes |
| Proveedor | id, nombre, contacto, productos[], historial_compras[], documentos[] | → Pedidos_Proveedor, Inventario |
| Permiso | usuario_id/rol_id, módulo, acción, habilitado | → Usuarios, Roles, Módulos |

---

## Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────┐
│              HOSTINGER (Frontend)                │
│         React + Vite + TailwindCSS              │
│    Recharts/Chart.js | FCM client               │
└─────────────────┬───────────────────────────────┘
                  │ HTTPS / WebSocket
┌─────────────────▼───────────────────────────────┐
│               RAILWAY (Backend)                  │
│  Node.js + Express (API REST principal)         │
│  Python + FastAPI (microservicio análisis/IA)   │
└──────┬──────────────────────────┬───────────────┘
       │                          │
┌──────▼──────┐          ┌───────▼────────────────┐
│  SUPABASE   │          │   SERVICIOS EXTERNOS    │
│ PostgreSQL  │          │ Google Vision API (OCR) │
│ Auth        │          │ Anthropic API (IA)      │
│ Realtime    │          │ Google API (voz/facial) │
│ Storage     │          │ Firebase FCM (push)     │
└─────────────┘          │ Web Scraping (catálogo) │
                         └────────────────────────┘
```

---

## Interview Transcript

<details>
<summary>Transcripción completa (4 rondas)</summary>

### Ronda 1
**Q:** ¿Para qué tipo de empresa o negocio específico está diseñado este sistema?
**A:** "Un poco de la 1 y la 4" (Distribuidora/Mayorista + Retail/Tienda)
**Ambigüedad:** 70% (Meta: 0.35, Restricciones: 0.40, Criterios: 0.15)

### Ronda 2
**Q:** ¿Cuál es el flujo central del negocio hoy?
**A:** El usuario compartió el documento `especificaciones_sistema.docx` con especificaciones completas del sistema.
**Acción:** Se extrajo y procesó el documento completo (27 módulos, jerarquía de roles, flujos detallados).
**Ambigüedad:** 22% (Meta: 0.90, Restricciones: 0.75, Criterios: 0.65)

### Ronda 3
**Q:** ¿Cuántas sucursales y usuarios tiene el negocio actualmente?
**A:** 5 sucursales + 1 bodega central (CEDIS) con sistema propio que provee datos. ~50 usuarios.
**Ambigüedad:** 17.3% (Meta: 0.92, Restricciones: 0.85, Criterios: 0.68)

### Ronda 4
**Q:** ¿Cuál es el módulo o grupo de módulos que necesitas funcionando PRIMERO?
**A:** Todos son útiles — el sistema no se usará hasta estar completamente terminado.
**Ambigüedad:** 13.9% (Meta: 0.93, Restricciones: 0.88, Criterios: 0.75) ✅ PASSED

</details>
