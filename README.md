# Fichaje LOSUAN Limpiezas

App web de control horario (registro de jornada) para el equipo de LOSUAN Limpiezas.

- Cada empleada ficha entrada y salida desde su móvil. La hora la marca el servidor, no el teléfono.
- La administradora ve todos los fichajes, filtra por empleada y fechas, descarga el registro en CSV (abre en Excel) y corrige fichajes olvidados. Cada corrección queda registrada con motivo, autora y fecha.
- Altas: la empleada se registra desde el enlace de la app y la administradora la activa en la pestaña «Empleadas».

## Técnica

- Frontend: React + Vite, publicado en GitHub Pages con `.github/workflows/publicar.yml`.
- Datos y acceso: Supabase. El esquema y las reglas de seguridad están en `supabase/schema.sql`.
- La primera persona que se registra queda como administradora.
