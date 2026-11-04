# Git y entregas

## Ramas

- `main` siempre compila y pasa CI. Nadie hace push directo a `main`.
- Ramas cortas desde `main`: `feat/registro-restaurante`, `fix/total-pedido`, `docs/adr-auth`,
  `chore/actualizar-deps`.
- Se integra con pull request y al menos una revisión de otro integrante del equipo.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/) en inglés, en imperativo y en
minúsculas. El hook `commit-msg` y la CI rechazan los mensajes que no cumplen el formato.

```text
<tipo>(<alcance>): <descripción>

feat(backend): add restaurant registration use case
fix(frontend): show empty state when the menu has no products
docs: add ADR for authentication
```

| Tipo       | Para                                      |
| ---------- | ----------------------------------------- |
| `feat`     | Funcionalidad nueva                       |
| `fix`      | Corrección de un error                    |
| `refactor` | Cambio interno sin cambiar comportamiento |
| `test`     | Tests nuevos o corregidos                 |
| `docs`     | Documentación                             |
| `chore`    | Mantenimiento, configuración              |
| `ci`       | Pipeline de CI                            |

Alcances permitidos: `backend`, `frontend`, `db`, `docs`, `ci`, `deps`, `ai`. El alcance es opcional.

## Pull requests

- Pequeños: menos de 400 líneas cambiadas como referencia.
- Usan la plantilla de `.github/pull_request_template.md`.
- La CI debe pasar: formato, lint, arquitectura, tests y build.

## Código escrito con IA

El código generado por un asistente de IA sigue exactamente las mismas reglas y revisiones. La
persona que abre el pull request es responsable de entenderlo y defenderlo.

## Definition of Done

Una tarea está terminada cuando:

- [ ] Cumple los criterios de aceptación de la historia
- [ ] Tiene tests en la capa correcta y la verificación completa pasa en local
- [ ] No agrega excepciones a reglas de lint, formato o arquitectura
- [ ] La UI cubre los cuatro estados (si hay UI)
- [ ] La documentación o una ADR reflejan cualquier decisión nueva
- [ ] Los commits siguen Conventional Commits
