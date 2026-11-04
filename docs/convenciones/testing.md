# Estrategia de tests

Se prueba comportamiento, no líneas. Cada cambio lleva tests en la capa donde vive la lógica.

## Backend

| Capa                         | Tipo de test | Herramientas                                     | Reglas                                                 |
| ---------------------------- | ------------ | ------------------------------------------------ | ------------------------------------------------------ |
| `domain`                     | Unitario     | JUnit + AssertJ                                  | Sin Spring, sin mocks                                  |
| `application`                | Unitario     | JUnit + fakes en memoria de los puertos          | Sin Spring. Se escribe un fake, no se mockea el puerto |
| `infrastructure.persistence` | Integración  | `@DataJpaTest` + Testcontainers                  | PostgreSQL real, nunca H2                              |
| `infrastructure.web`         | Slice        | `@WebMvcTest` + `MockMvcTester` + `@MockitoBean` | Estados HTTP, validación y Problem Details             |
| Arquitectura                 | ArchUnit     | `ArchitectureTest`                               | No se desactivan reglas                                |
| Aplicación completa          | Contexto     | `@SpringBootTest` + Testcontainers               | Solo `contextLoads` y flujos críticos                  |

- Nombre del método: describe el comportamiento en inglés, en camelCase:
  `rejectsAnOrderWithoutItems`, `returnsNotFoundWhenTheRestaurantDoesNotExist`.
- Una conducta por test. Preparación, acción y verificación separadas por líneas en blanco.
- Los tests de persistencia y de contexto necesitan Docker encendido.
- El ejemplo de cada tipo está en
  [.claude/skills/backend-feature/reference.md](../../.claude/skills/backend-feature/reference.md).

## Frontend

| Qué                         | Cómo                                                                 |
| --------------------------- | -------------------------------------------------------------------- |
| Páginas                     | `TestBed` + `HttpTestingController`; se verifican los cuatro estados |
| Componentes de presentación | Se les pasan inputs y se revisa el DOM y los outputs                 |
| Stores y funciones puras    | Tests unitarios directos, sin `TestBed` si no hace falta             |

- Vitest. El archivo `xxx.spec.ts` va al lado del archivo que prueba.
- Se prueba lo que ve el usuario (texto, atributos, estados), no detalles internos del componente.
- Descripciones en inglés: `it('shows an empty message when the restaurant has no products')`.

## Qué no se hace

- Tests que llaman a servicios externos reales.
- `@Disabled` o `it.skip` sin un issue que explique por qué.
- Bajar una regla de ArchUnit o ESLint para que un test pase.
