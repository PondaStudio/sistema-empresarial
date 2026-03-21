# Sistema Empresarial — CLAUDE.md

## Stack
- **Frontend:** React + Vite + TailwindCSS
- **Backend:** Node.js + Express → https://lightcoral-guanaco-765978.hostingersite.com (Hostinger)
- **Análisis:** Python + FastAPI → mismo servicio Render (proceso separado vía `Procfile`)
- **Patrón:** Express es el único gateway público; FastAPI es servicio interno llamado por Express
- **Base de datos y auth:** Supabase

## Repositorio
GitHub: `PondaStudio/sistema-empresarial`

## Escala del sistema
- 5 sucursales + CEDIS
- ~50 usuarios
- 11 roles jerárquicos
- 27 módulos (ver `especificaciones_sistema.docx`)
