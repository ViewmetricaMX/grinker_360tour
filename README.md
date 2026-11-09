# Grinker Hospital · Visor 360°

Visor estático basado en Three.js r128. El recorrido y sus conexiones se configuran en `grinker_tour.json`.

## Ejecutar localmente

Desde la carpeta del proyecto:

```bash
python -m http.server 8000
```

Abrir `http://localhost:8000`. No abrir `index.html` mediante doble clic: el visor carga el JSON con `fetch()`.

## Archivos de imagen

Las rutas de `grinker_tour.json` apuntan a imágenes JPG en la raíz del proyecto. Mantén los nombres de archivo exactamente como aparecen en el JSON.

**Pendientes de incorporar:** `habitacion-01.jpg`, `habitacion-02.jpg`, `habitacion-03.jpg` y `habitacion-04.jpg`. Mientras no se suban, esas cuatro escenas mostrarán un error recuperable; las otras escenas pueden cargarse de forma independiente.

## Editar hotspots

Abrir una escena panorámica con `?edit=1`, por ejemplo:

`http://localhost:8000/?edit=1#urgencias-01`

Haz clic en el punto de la panorámica donde debe aparecer el hotspot. El HUD muestra yaw/pitch y el fragmento JSON; si el navegador bloquea el portapapeles, copia el fragmento manualmente.

- `yaw`: -180° a 180°. 0° al centro; positivo hacia la derecha.
- `pitch`: -85° a 85°. 0° en el horizonte; positivo hacia arriba.
- Las escenas de tipo `photo` son imágenes planas: no usan yaw/pitch. Su navegación se define mediante `hotspots` y se muestra como botones superpuestos.

## Estructura del JSON

- `areas`: orden y agrupación de escenas en la interfaz.
- `scenes`: tipo de escena, ruta, vista inicial y hotspots.
- `pano`: panorámica equirectangular 2:1.
- `photo`: fotografía plana con zoom y arrastre.

## Notas de despliegue

Sube juntos `index.html`, `grinker_tour.json` y todos los JPG. Three.js r128 se carga desde cdnjs, por lo que el visor necesita conexión a internet para descargar esa biblioteca.
