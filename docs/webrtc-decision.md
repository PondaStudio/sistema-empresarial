# WebRTC Decision — Módulo de Comunicación (Audio en Tiempo Real)

## Estado: PENDIENTE — requiere decisión del usuario antes de implementar

## Opciones evaluadas

| Opción | Costo estimado | Complejidad | Recomendación |
|--------|---------------|-------------|---------------|
| **LiveKit self-hosted en Render** | ~$25/mes (Render service) | Alta — requiere servidor SFU | Mejor control, sin costo por minuto |
| **Daily.co managed** | $0.004/min/participante (~$20-50/mes para 50 usuarios) | Baja — SDK simple | Más rápido de implementar |
| **simple-peer + signaling custom** | $0 + infra Render | Media | Control total pero más código |

## Decisión recomendada: Daily.co
- SDK de React disponible (`@daily-co/daily-react`)
- Implementación en ~2-3 días vs semanas para LiveKit self-hosted
- Costo predecible para 50 usuarios con uso moderado
- No requiere infraestructura TURN/STUN adicional

## Implementado ahora (sin WebRTC)
- Canales de texto por sucursal/área ✅
- Mensajes de texto en tiempo real (Supabase Realtime) ✅
- Notas de voz (upload de audio + playback) ✅
- Archivos adjuntos ✅
- Estados de presencia ✅

## Pendiente (requiere decisión WebRTC)
- Audio en tiempo real (voz) en canales
- Video calls (si aplica)

## Pregunta para el usuario
¿Cuál opción de WebRTC prefieres?
1. Daily.co (managed, rápido)
2. LiveKit self-hosted (más control)
3. simple-peer custom (más código, sin costo)
4. Omitir audio en tiempo real por ahora (solo notas de voz)
