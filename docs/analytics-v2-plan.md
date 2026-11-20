# Viewmetrica 360 Analytics v2 — Grinker (staging)

## Estado
- Rama: `feature/analytics-v2`.
- Producción: **sin cambios**. No se ha editado `index.html`, `analytics.js` ni `analytics-config.js`.
- `analytics-v2-client.js`: módulo auxiliar **no cargado todavía**; calcula dispositivo y procedencia. No envía datos.
- Ciudad: `Desconocida` hasta implementar y verificar GeoIP.

## Arquitectura propuesta
1. Mantener los eventos existentes y el dashboard actual.
2. Registrar una fila por sesión en una pestaña `Sesiones` nueva: fecha, sesión, ciudad, región, país, dispositivo, fuente.
3. Evitar que las retransmisiones creen sesiones duplicadas: usar clave de sesión y bloqueo en Apps Script.
4. Calcular `Por ciudad` y `Por dispositivo` desde `Sesiones`, sin borrar `Eventos`.
5. GeoIP: escoger proveedor y revisar términos, retención, transferencias y aviso de privacidad; la IP se procesa para resolver ciudad, pero **no se persiste** en Google Sheets. No pedir GPS.
6. La geolocalización por IP puede ser incorrecta, sobre todo en VPN/red móvil; agrupar como `Desconocida` cuando no haya dato.
7. `document.referrer` puede omitirse por políticas de privacidad o navegación; `utm_source` es más confiable cuando los enlaces están etiquetados. No etiquetar tráfico desconocido como directo confirmado.
8. Validar envío en entorno de prueba con Apps Script separado o despliegue de prueba, y comprobar que la tabla `Eventos` y el dashboard original no se alteran.

## Pendientes antes de activar
- Verificar el `Code.gs` **actual** y su despliegue; diseñar recepción de metadatos idempotente.
- Seleccionar servicio GeoIP compatible con privacidad y CORS, o un backend propio de consulta.
- Implementar transporte con reintentos que no pierda eventos silenciosamente; evitar duplicaciones.
- Pruebas de escritorio/móvil, enlace etiquetado, navegador sin referencia, GeoIP fallido, recarga y eventos duplicados.
- Activar solo después de probar y contar con el aviso de privacidad actualizado.
