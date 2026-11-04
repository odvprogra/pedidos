@AGENTS.md

## Claude Code

### Skills

| Skill              | Cuándo                                                                 |
| ------------------ | ---------------------------------------------------------------------- |
| `backend-feature`  | Agregar o cambiar un caso de uso, entidad o endpoint en el backend     |
| `frontend-feature` | Agregar o cambiar una pantalla, formulario o componente en el frontend |
| `verify`           | Antes de dar una tarea por terminada                                   |
| `adr`              | Cuando se toma o se cambia una decisión técnica                        |
| `pull-request`     | Solo cuando el usuario lo pide con `/pull-request`                     |

### Agentes

| Agente                  | Cuándo                                                  |
| ----------------------- | ------------------------------------------------------- |
| `story-analyst`         | Al empezar una historia nueva o ante un pedido ambiguo  |
| `test-writer`           | Después de implementar, o cuando faltan casos de prueba |
| `architecture-reviewer` | Antes de un pull request                                |
| `ui-reviewer`           | Antes de un pull request que cambia pantallas           |

### Hooks

Cada vez que se edita un archivo de `frontend/src`, un hook lo formatea con Prettier. Los archivos
Java se formatean con `./mvnw spotless:apply` dentro de la skill `verify`.
