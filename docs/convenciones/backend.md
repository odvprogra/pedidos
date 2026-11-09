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
| Adaptador con seguridad | `infrastructure.security`    | `BcryptPasswordHasher`                            |
| Tarea al arrancar       | `infrastructure.startup`     | `FirstAdminRunner`                                |
| Adaptador a otro módulo | `infrastructure.<modulo>`    | `RestaurantDirectoryAdapter`                      |
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
  `restaurant.open()`. Ahí se validan las reglas.
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
  `null`. La excepción es el puerto hacia otro módulo: su adaptador deja pasar la excepción del caso
  de uso que llama, como `RestaurantNotFoundException` en `catalog`, o la traduce a una excepción
  del propio módulo y la relanza, como `RestaurantUnavailableException` en `order`. Nunca la atrapa
  para seguir, por la razón que explica
  [arquitectura.md](../arquitectura.md#comunicación-entre-módulos).

## Infraestructura

- Las clases de `infrastructure` son package-private. Lo único público de un módulo hacia afuera
  son sus casos de uso, sus commands y su dominio.
- Entidad JPA: `@Getter`, `@Setter`, `@NoArgsConstructor(access = PROTECTED)`. La conversión vive
  en la propia entidad: `static XxxEntity fromDomain(Xxx)` y `Xxx toDomain()`.
- Relaciones `LAZY` por defecto. Relaciones bidireccionales solo si hacen falta.
- Requests con Bean Validation (`@NotBlank`, `@Size`, `@Positive`) y un método `toCommand()`. Si
  crear y editar reciben el mismo body, un solo request tiene `toCreateCommand()` y
  `toEditCommand(id)` (`ProductRequest`). Responses con `static XxxResponse from(Xxx)`.
- Los controllers no tienen lógica: convierten, llaman al caso de uso y responden.

## Seguridad

Lo decidido en [ADR-0008](../adr/0008-autenticacion-con-sesion-y-roles.md):

- Cada método de controller que exige un rol lo declara con `@PreAuthorize("hasRole('OWNER')")`.
  Las rutas públicas se agregan en `SecurityConfig`; todo lo demás exige sesión.
- Una ruta pública va en un controller aparte, sin `@PreAuthorize` ni `CurrentUser`
  (`PublicRestaurantController`), y en `SecurityConfig` se abre solo para `GET`. Si su patrón
  también coincide con rutas que exigen sesión, como `/api/v1/restaurants/*` con `/mine`, esas
  rutas se declaran antes. Su test prueba que responde sin sesión y que una escritura sigue en `401`.
- El usuario llega al controller con `@AuthenticationPrincipal CurrentUser user`, y su id viaja en
  el command (`UpdateMenuCommand(ownerId, ...)`). Los casos de uso y el dominio nunca leen el
  contexto de seguridad.
- La pertenencia la valida el caso de uso. Si no se cumple, lanza una subclase de
  `ForbiddenException` con el código `<modulo>.not_owner`.
- Las contraseñas solo existen como hash: nunca aparecen en logs, responses ni `toString`.

## Datos

Las tablas de cada módulo y sus reglas están en [modelo-de-datos.md](../modelo-de-datos.md).

- IDs: `Long` generados por la base (`IDENTITY`).
- Dinero: `BigDecimal`, nunca `double`. Columna `numeric(12, 2)`, redondeo `HALF_UP`. La moneda es
  bolivianos (BOB).
- Fechas: `Instant` en dominio y persistencia, columnas `timestamptz`. La hora actual sale de un
  `java.time.Clock` inyectado, nunca de `Instant.now()` directo, para que los tests la fijen. Se
  convierten a hora local solo en el frontend.
- Enums: `@Enumerated(EnumType.STRING)` sobre una columna `varchar(20)` con un `check` de los
  valores válidos.
- Cada tabla es de un solo módulo. Ningún módulo lee ni escribe las tablas de otro.
- Referencias: dentro del módulo, clave foránea mapeada como columna `Long`; entre módulos, solo el
  id, sin clave foránea. La única relación JPA es la de un agregado con sus partes (`Order` y sus
  ítems).

### Migraciones

Lo decidido en [ADR-0009](../adr/0009-modelo-de-datos-y-migraciones-con-flyway.md):

- El esquema lo crea Flyway y Hibernate solo lo valida (`ddl-auto: validate`). Si una entidad no
  coincide con su tabla, la aplicación no arranca.
- Los archivos van en `backend/src/main/resources/db/migration` y se llaman
  `V<n>__<descripcion>.sql`: el número libre siguiente, sin ceros a la izquierda, y la descripción
  en inglés y snake_case (`V1__create_accounts.sql`, `V5__add_image_to_products.sql`). Un nombre mal
  formado hace fallar el arranque (`spring.flyway.validate-migration-naming`).
- Una migración por feature, en el mismo PR, con las tablas que esa feature usa.
- Una migración que ya está en `main` no se edita; el cambio va en una migración nueva. Flyway
  compara los checksums al arrancar.
- Si al actualizar la rama el número ya está tomado, se renumera la migración propia antes del
  merge. Después de renumerar o borrar una migración, `./mvnw clean` saca la copia vieja de
  `target/`; si no, Flyway encuentra dos versiones iguales y no arranca.
- SQL en minúsculas, tablas en plural y snake_case. Cada tabla empieza con
  `id bigint generated by default as identity primary key`. Todo es `not null` salvo lo opcional,
  hay un `check` para enums y rangos, y un índice por cada columna `_id`, porque PostgreSQL no
  indexa las claves foráneas. Las restricciones en línea usan el nombre que les da PostgreSQL
  (`accounts_email_key`, `products_price_check`); los índices creados aparte se llaman
  `<tabla>_<columnas>_idx`, o `_key` si son únicos.
- La entidad repite en `@Column` el largo, la precisión y si acepta nulos, para que se lea igual que
  la migración.
- Si la base local tiene tablas que no creó Flyway, se borra con `docker compose down -v`.

## Estilo

- Formato automático con Spotless (palantir-java-format). Antes de commitear:
  `./mvnw spotless:apply`. `./mvnw verify` falla si el formato no está aplicado.
- Sin comentarios ni Javadoc. Si algo necesita explicación, se renombra o se extrae un método. La
  única excepción es un _por qué_ que el código no puede expresar (un workaround, una regla externa),
  en una línea.
- Inyección siempre por constructor (`@RequiredArgsConstructor` sobre campos `private final`). Si la
  clase prepara un valor al construirse, como el hash de relleno de `LogInUseCase`, el constructor
  se escribe a mano.
- Logs con `@Slf4j`, nunca `System.out`. No se registran contraseñas ni datos personales.
- Sin código muerto ni comentado.
- Configuración en `application.yml` con variables de entorno. Ningún secreto en el repositorio.
