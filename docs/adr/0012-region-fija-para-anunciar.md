# 0012. Lo que se anuncia sin mover el foco va a una región fija

- **Estado:** Propuesta
- **Fecha:** 2026-11-10

## Contexto

Los esqueletos de carga y los avisos de éxito llevaban su propio `role="status"` y entraban al DOM
con el texto ya puesto. Muchos lectores de pantalla solo anuncian los cambios dentro de una región
que ya existía, así que "Cargando tu menú…" o "Suspendiste La Casona." podían no oírse. Los errores
no tienen ese problema: un `role="alert"` que entra al DOM se anuncia.

La pieza que anuncia la usan `app-alert` y las páginas, que están en `shared/ui` y en las features.
ESLint no deja que `shared` importe de `core`, y el proyecto no usa `@angular/cdk`.

## Decisión

Vamos a tener una sola región `role="status"`, `sr-only` y vacía desde que arranca la app:
`app-live-region`, montada en `app.html` después del `<main>`. `Announcer`, un servicio raíz, guarda
el anuncio vigente con un id nuevo cada vez, así un mismo mensaje se vuelve a anunciar. La directiva
`appAnnounce` escribe en la región el texto de su elemento cuando aparece y lo saca cuando se va.
Los esqueletos y la caja de éxito dejan de llevar `role="status"`, para que nada se lea dos veces;
los errores siguen con `role="alert"`.

Las tres piezas viven en `shared/ui/live-region`. En `shared` solo entran servicios de interfaz como
este: sin reglas de negocio, sin HTTP y sin datos de la sesión.

## Alternativas consideradas

- **`LiveAnnouncer` de `@angular/cdk/a11y`:** hace lo mismo, pero suma `@angular/cdk` entera por
  una sola clase, y hoy no se puede instalar nada en `frontend/` hasta pasar a Node 24.
- **El servicio en `core` y un `InjectionToken` en `shared`:** respeta la frontera al pie de la
  letra, pero agrega una indirección sin ganar nada: el servicio no conoce el dominio ni la API.
- **Una región fija en cada página:** repite el mismo markup en diez páginas, y en `app-alert` no
  resuelve nada, porque el aviso entra y sale con su texto.
- **Dejar el `role="status"` en cada pieza:** es lo que había; no garantiza el anuncio.

## Consecuencias

- **Positivas:** la carga y los avisos de éxito se anuncian en todos los lectores; un componente
  nuevo anuncia con un atributo; los specs leen lo anunciado con `TestBed.inject(Announcer)`; al irse
  el esqueleto o el aviso, la región queda vacía y no se lee un texto viejo.
- **Negativas:** `shared/ui` tiene ahora un servicio con estado, y hay que vigilar que no entre ahí
  lógica de negocio. En la primera carga de la app la región y el primer esqueleto aparecen casi a la
  vez, y ese primer "Cargando…" puede no oírse. El carrito, el menú y "Actualizar" en los pedidos
  todavía tienen su propia región `aria-live`, que funciona pero queda por pasar a la fija.
