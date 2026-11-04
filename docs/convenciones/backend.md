# Convenciones del backend

Complementa a [arquitectura.md](../arquitectura.md). El ejemplo completo de cada pieza está en
[.claude/skills/backend-feature/reference.md](../../.claude/skills/backend-feature/reference.md).

## Nombres

| Pieza                   | Paquete                      | Ejemplo                                           |
| ----------------------- | ---------------------------- | ------------------------------------------------- |
| Modelo de dominio       | `domain.model`               | `Restaurant`                                      |
| Puerto                  | `domain.port`                | `RestaurantRepository`                            |
| Excepción de negocio    | `domain.exception`           | `RestaurantNotFoundException`                     |
| Caso de uso             | `application`                | `RegisterRestaurantUseCase`                       |
| Datos de entrada        | `application`                | `RegisterRestaurantCommand`                       |
| Entidad JPA             | `infrastructure.persistence` | `RestaurantEntity`                                |
| Repositorio Spring Data | `infrastructure.persistence` | `RestaurantJpaRepository`                         |
| Adaptador del puerto    | `infrastructure.persistence` | `RestaurantPersistenceAdapter`                    |
| Controller              | `infrastructure.web`         | `RestaurantController`                            |
| Request / Response      | `infrastructure.web`         | `RegisterRestaurantRequest`, `RestaurantResponse` |

Los casos de uso se nombran con verbo + sustantivo del negocio: `PlaceOrder`, `PublishProduct`,
`CancelOrder`. Nada de `RestaurantService` con veinte métodos.

## Dominio

- Java puro: sin anotaciones de Spring, JPA ni Jackson.
- Los value objects y datos inmutables son `record`.
- Las entidades tienen un constructor con todos los campos (para reconstruirlas desde la base) y
  métodos de fábrica con nombre del negocio para crearlas (`Restaurant.register(...)`).
- No hay setters. Los cambios de estado son métodos con intención: `order.confirm()`,
  `restaurant.deactivate()`. Ahí se validan las reglas.
- Lombok: solo `@Getter`. Nunca `@Data`, `@Setter` ni `@Builder` en el dominio.
- Las reglas rotas se lanzan como `DomainException` con un código estable
  (`"order.empty"`, `"restaurant.name_required"`). Se crea una subclase propia solo cuando el error
  se repite o necesita un estado HTTP distinto: extiende `NotFoundException` (404), y con la
  autenticación también `ConflictException` (409), `ForbiddenException` (403) o
  `UnauthenticatedException` (401), todas en `shared.domain.exception`.

## Aplicación

- Una clase por caso de uso con un único método público `execute`.
- `@Service`, `@RequiredArgsConstructor` y `@Transactional` (`readOnly = true` en las lecturas).
- Recibe un command (`record`) o tipos simples; devuelve modelos de dominio. Nunca recibe ni
  devuelve requests, responses ni entidades JPA.
- Si no encuentra algo, lanza la excepción del módulo. Los puertos devuelven `Optional`, nunca
  `null`.

## Infraestructura

- Las clases de `infrastructure` son package-private. Lo único público de un módulo hacia afuera
  son sus casos de uso, sus commands y su dominio.
- Entidad JPA: `@Getter`, `@Setter`, `@NoArgsConstructor(access = PROTECTED)`. La conversión vive
  en la propia entidad: `static XxxEntity fromDomain(Xxx)` y `Xxx toDomain()`.
- Relaciones `LAZY` por defecto. Relaciones bidireccionales solo si hacen falta.
- Requests con Bean Validation (`@NotBlank`, `@Size`, `@Positive`) y un método `toCommand()`.
  Responses con `static XxxResponse from(Xxx)`.
- Los controllers no tienen lógica: convierten, llaman al caso de uso y responden.

## Seguridad

Lo decidido en [ADR-0008](../adr/0008-autenticacion-con-sesion-y-roles.md):

- Cada método de controller que exige un rol lo declara con `@PreAuthorize("hasRole('OWNER')")`.
  Las rutas públicas se agregan en `SecurityConfig`; todo lo demás exige sesión.
- El usuario llega al controller con `@AuthenticationPrincipal CurrentUser user`, y su id viaja en
  el command (`UpdateMenuCommand(ownerId, ...)`). Los casos de uso y el dominio nunca leen el
  contexto de seguridad.
- La pertenencia la valida el caso de uso. Si no se cumple, lanza una subclase de
  `ForbiddenException` con el código `<modulo>.not_owner`.
- Las contraseñas solo existen como hash: nunca aparecen en logs, responses ni `toString`.

## Datos

- IDs: `Long` generados por la base (`IDENTITY`).
- Dinero: `BigDecimal`, nunca `double`. Columna `numeric(12, 2)`, redondeo `HALF_UP`. La moneda es
  bolivianos (BOB).
- Fechas: `Instant` en dominio y persistencia, columnas `timestamptz`. Se convierten a hora local
  solo en el frontend.
- Esquema: mientras el modelo se diseña, Hibernate lo actualiza (`ddl-auto: update`). Antes de la
  primera entrega se pasa a migraciones con Flyway ([ADR-0003](../adr/0003-stack-base.md)).

## Estilo

- Formato automático con Spotless (palantir-java-format). Antes de commitear:
  `./mvnw spotless:apply`. `./mvnw verify` falla si el formato no está aplicado.
- Sin comentarios ni Javadoc. Si algo necesita explicación, se renombra o se extrae un método. La
  única excepción es un _por qué_ que el código no puede expresar (un workaround, una regla externa),
  en una línea.
- Inyección siempre por constructor (`@RequiredArgsConstructor` sobre campos `private final`).
- Logs con `@Slf4j`, nunca `System.out`. No se registran contraseñas ni datos personales.
- Sin código muerto ni comentado.
- Configuración en `application.yml` con variables de entorno. Ningún secreto en el repositorio.
