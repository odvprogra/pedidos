# 0002. Arquitectura hexagonal por módulos en el backend

- **Estado:** Aceptada
- **Fecha:** 2026-10-14

## Contexto

El sistema tiene partes con reglas de negocio reales (el ciclo de vida de un pedido, el cálculo del
total, qué puede hacer cada rol) y partes que son casi CRUD (datos del restaurante, catálogo). Gran
parte del código lo va a generar un asistente de IA, que tiende a mezclar capas si la estructura no
es clara y verificable.

## Decisión

Vamos a organizar el backend como un monolito modular con arquitectura hexagonal dentro de cada
módulo:

- Un paquete por módulo de negocio (`restaurant`, `catalog`, `order`, ...) con `domain`,
  `application` e `infrastructure`.
- El dominio es Java puro. La persistencia (JPA) y la web (controllers) son adaptadores.
- Un caso de uso por clase. Los puertos son interfaces en `domain.port`.
- Los casos de uso pueden usar `@Service` y `@Transactional`; no separamos la configuración de Spring
  en otra capa (por eso es una hexagonal "ligera").
- Las reglas de dependencia se verifican con ArchUnit en `ArchitectureTest` y rompen el build.

El detalle está en [arquitectura.md](../arquitectura.md).

## Alternativas consideradas

- **Capas por feature (controller, service, repository con entidades JPA):** más rápida al inicio,
  pero la lógica queda acoplada a JPA y es difícil de probar sin base de datos.
- **Clean Architecture completa:** interfaces de entrada por caso de uso, presenters y capas globales.
  Mucha ceremonia por cada feature para el tamaño del proyecto.
- **Microservicios:** el equipo y el alcance no justifican el costo de operar varios servicios.

## Consecuencias

- **Positivas:** el dominio se prueba sin Spring ni base de datos; la estructura es la misma en todos
  los módulos, lo que hace al código predecible para el equipo y para la IA; las violaciones se
  detectan en el build y no en la revisión.
- **Negativas:** hay más archivos por feature (entidad JPA separada del modelo, adaptador, mapeo). En
  módulos simples se siente como trabajo extra; lo aceptamos a cambio de consistencia.
