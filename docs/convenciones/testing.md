# Estrategia de tests

Se prueba comportamiento, no líneas. Cada cambio lleva tests en la capa donde vive la lógica.

## Backend

| Capa                         | Tipo de test | Herramientas                                     | Reglas                                                 |
| ---------------------------- | ------------ | ------------------------------------------------ | ------------------------------------------------------ |
| `domain`                     | Unitario     | JUnit + AssertJ                                  | Sin Spring, sin mocks                                  |
| `application`                | Unitario     | JUnit + fakes en memoria de los puertos          | Sin Spring. Se escribe un fake, no se mockea el puerto |
| `infrastructure.persistence` | Integración  | `@DataJpaTest` + Testcontainers                  | PostgreSQL real con el esquema de Flyway, nunca H2     |
| `infrastructure.web`         | Slice        | `@WebMvcTest` + `MockMvcTester` + `@MockitoBean` | Estados HTTP, validación, permisos y Problem Details   |
| `infrastructure.security`    | Unitario     | JUnit + AssertJ                                  | Sin Spring, con la librería real (BCrypt)              |
| Sesiones en `shared`         | Integración  | `@JdbcTest` + Testcontainers                     | Spring Session JDBC real sobre el esquema de Flyway    |
| `infrastructure.startup`     | Unitario     | JUnit + mock del caso de uso                     | Qué hace con cada configuración, sin Spring            |
| Adaptador a otro módulo      | Unitario     | JUnit + mock del caso de uso del otro módulo     | Qué devuelve y qué error deja pasar, sin Spring        |
| Arquitectura                 | ArchUnit     | `ArchitectureTest`                               | No se desactivan reglas                                |
| Aplicación completa          | Contexto     | `@SpringBootTest` + Testcontainers               | Solo `contextLoads` y flujos críticos, como la sesión  |

- Un bloqueo de la base, como el de `findByIdForUpdate` en los pedidos, se prueba con dos
  transacciones reales en un `@SpringBootTest` (`OrderLockingTest`): una toma la fila y espera un
  `CountDownLatch`, y la otra tiene que quedar esperando hasta que la primera termina. Sin el
  bloqueo el test falla, porque la segunda no espera.
- Nombre del método: describe el comportamiento en inglés, en camelCase:
  `rejectsAnOrderWithoutItems`, `returnsNotFoundWhenTheRestaurantDoesNotExist`.
- Una conducta por test. Preparación, acción y verificación separadas por líneas en blanco.
- Los tests de persistencia y de contexto necesitan Docker encendido.
- El ejemplo de cada tipo está en
  [.claude/skills/backend-feature/reference.md](../../.claude/skills/backend-feature/reference.md).

### Seguridad

Las reglas de [ADR-0008](../adr/0008-autenticacion-con-sesion-y-roles.md) se prueban en tres
niveles:

- **Caso de uso:** la pertenencia (el recurso es de otro usuario) se prueba con fakes, sin Spring,
  porque el caso de uso recibe el id del usuario en el command.
- **Controller:** `@WebMvcTest(XxxController.class)` lleva `@Import(SecurityConfig.class)`, así
  aplica las rutas públicas, los `@PreAuthorize` y las respuestas 401 y 403 reales. Cada endpoint
  protegido tiene tres casos: sin sesión (`401` con `unauthenticated`), con el rol incorrecto
  (`403` con `access_denied`) y con el rol correcto (la respuesta esperada). La matriz de roles se
  escribe con `@ParameterizedTest`. El usuario se simula con el helper
  `TestSessions.sessionOf(rol, id)` de los tests de `shared`, que arma el mismo `CurrentUser` que la
  app: `.with(sessionOf("OWNER", 7L))`. Las peticiones que modifican agregan `.with(csrf())`, y un
  test de `AuthController` verifica que sin el token se responde `403` con `csrf_invalid`. La cookie
  `XSRF-TOKEN` no se prueba en el slice: `csrf()` cambia el repositorio de tokens del contexto
  cacheado, y desde ahí ningún test de ese contexto la recibe. La prueba el flujo completo.
- **Flujo completo:** un `@SpringBootTest` con Testcontainers usa la cookie real y Spring Session.
  Recorre registro, `/me`, logout (después responde 401) y suspensión (la sesión que estaba abierta
  responde 401 en la próxima petición). Arranca con `ADMIN_EMAIL` y `ADMIN_PASSWORD` en
  `properties`, así el admin que suspende es el que creó el backend al arrancar. También cubre los
  adaptadores que solo delegan, como `SpringSessionAccountSessions`, que no tienen test propio.

Ningún test desactiva la seguridad (`addFilters = false` o excluir su autoconfiguración) para que
algo pase.

### Migraciones

Las migraciones de Flyway ([ADR-0009](../adr/0009-modelo-de-datos-y-migraciones-con-flyway.md)) no
tienen tests propios; las prueban los tests que ya usan Testcontainers:

| Qué se verifica                                      | Dónde                                        | Cómo falla                              |
| ---------------------------------------------------- | -------------------------------------------- | --------------------------------------- |
| Todas las migraciones corren sobre una base vacía    | Todo test con Testcontainers                 | El contexto no levanta                  |
| Cada entidad coincide con su tabla                   | `contextLoads`, por `ddl-auto: validate`     | `Schema validation: missing column ...` |
| El nombre de cada archivo                            | Al arrancar, por `validate-migration-naming` | `Invalid SQL filenames found`           |
| Las restricciones que sostienen una regla de negocio | `@DataJpaTest` del adaptador                 | `DataIntegrityViolationException`       |

- `validate` revisa tablas, columnas y tipos, pero no los `check`, los únicos ni los nulos. Por eso
  el test del adaptador guarda una fila que rompe la restricción y espera
  `DataIntegrityViolationException`: el correo repetido en otra capitalización, el segundo
  restaurante de un dueño, un precio en cero, una categoría repetida, una cantidad fuera de rango.
  Solo las restricciones que respaldan una regla, no cada columna.
- Los tests nunca crean el esquema con `ddl-auto: create` ni con scripts propios: usan el que dejan
  las migraciones. Los datos de cada test se arman con el adaptador.

## Frontend

| Qué                         | Cómo                                                                               |
| --------------------------- | ---------------------------------------------------------------------------------- |
| Páginas                     | `TestBed` + `HttpTestingController`; se verifican los cuatro estados               |
| Componentes de presentación | Se les pasan inputs y se revisa el DOM y los outputs                               |
| Stores y funciones puras    | Tests unitarios directos, sin `TestBed` si no hace falta                           |
| Sesión (`core/auth`)        | `SessionStore`, guards e interceptor: sin sesión, con sesión, rol incorrecto y 401 |

- Vitest. El archivo `xxx.spec.ts` va al lado del archivo que prueba.
- Se prueba lo que ve el usuario (texto, atributos, estados), no detalles internos del componente.
- Descripciones en inglés: `it('shows an empty message when the restaurant has no products')`.

## Qué no se hace

- Tests que llaman a servicios externos reales.
- `@Disabled` o `it.skip` sin un issue que explique por qué.
- Bajar una regla de ArchUnit o ESLint para que un test pase.
