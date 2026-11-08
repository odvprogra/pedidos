---
name: frontend-feature
description: Crea o extiende una feature del frontend Angular (rutas, páginas, componentes, cliente HTTP, modelos y tests) con Tailwind y las convenciones del proyecto. Usar cuando una tarea agrega o cambia una pantalla, un formulario, un componente o una llamada a la API en frontend/.
---

# Feature en el frontend

Antes de escribir código lee `docs/arquitectura.md` (sección frontend) y
`docs/convenciones/frontend.md`. El ejemplo completo y verificado está en
[reference.md](reference.md); úsalo como molde.

## 0. Alcance

- Identifica la feature (`restaurants`, `cart`, `orders`, `restaurant-admin`, `auth`...). Si no
  existe, se crea en `src/app/features/<feature>/`.
- Revisa qué endpoints necesita. Si el backend todavía no los tiene, acuerda primero el contrato
  (ruta, request, response) siguiendo `docs/convenciones/api.md`.
- Una feature no importa nada de otra. Lo compartido va a `shared/ui` (visual) o a `core`
  (servicios globales).

```text
src/app/features/<feature>/
├── <feature>.routes.ts      export const <FEATURE>_ROUTES: Routes
├── pages/<nombre>-page/     componentes enrutados
├── components/<nombre>/     componentes de presentación
├── data-access/             <recurso>-api.ts, <nombre>-store.ts
└── models/                  interfaces
```

## 1. Modelos y cliente HTTP

1. Interfaces en `models/` con la forma exacta del JSON de la API.
2. `XxxApi` en `data-access/` con `inject(HttpClient)` y URLs desde `environment.apiUrl`. Devuelve
   `Observable` y no guarda estado.

## 2. Páginas

1. `XxxPage` en `pages/xxx-page/`: inyecta el cliente, maneja el estado con `signal` y `computed`.
2. Cubre siempre los cuatro estados: cargando (skeleton con `role="status"`), error
   (`app-load-error` con el mensaje de `toProblemDetails` y "Reintentar"), vacío (explica qué hacer)
   y éxito.
3. Formularios: `NonNullableFormBuilder`, `markAllAsTouched()` al enviar, botón deshabilitado
   mientras se guarda y los `errors[]` del backend asignados a cada campo.

## 3. Componentes de presentación

1. En `components/`: solo `input()` y `output()`, sin servicios de datos.
2. Si sirve en más de una feature, va a `shared/ui/`.

## 4. Rutas

1. `XXX_ROUTES` en `<feature>.routes.ts` con `title` en cada ruta.
2. Se registra en `app.routes.ts` con `loadChildren` y una ruta en español (`/restaurantes`).

## 5. Estilos

Tailwind con los tokens de `src/styles.css` (`bg-brand`, `text-muted`, `border-line`,
`bg-danger-soft`...). Mobile first. Nada de colores sueltos ni estilos inline. Si falta un color, se
agrega un token con nombre semántico.

## 6. Tests

| Pieza            | Test                                                                         |
| ---------------- | ---------------------------------------------------------------------------- |
| Página con datos | `HttpTestingController`: cargando, vacío, error y éxito                      |
| Formulario       | No envía si es inválido, envía el body correcto, muestra errores del backend |
| Componente       | Inputs renderizados y outputs emitidos                                       |

## 7. Verificación

```bash
cd frontend
npm run format
npm run lint
npm test -- --watch=false
npm run build
```

## Checklist

- [ ] `OnPush`, `input()`/`output()`, `inject()`, control flow nuevo
- [ ] Cuatro estados en cada vista con datos
- [ ] Sin imports a otras features (lo verifica ESLint)
- [ ] Textos en español, código en inglés
- [ ] Accesible: labels, `alt`, botones con `type`, foco visible
- [ ] Sin comentarios en el código
- [ ] Lint, tests y build en verde
