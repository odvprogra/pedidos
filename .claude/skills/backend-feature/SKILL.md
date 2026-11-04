---
name: backend-feature
description: Crea o extiende un módulo del backend (modelo de dominio, caso de uso, persistencia, endpoint REST y sus tests) siguiendo la arquitectura hexagonal del proyecto. Usar cuando una tarea agrega o cambia un endpoint, un caso de uso, una entidad o una regla de negocio en backend/.
---

# Feature en el backend

Antes de escribir código lee `docs/arquitectura.md`, `docs/convenciones/backend.md` y
`docs/convenciones/api.md`. El ejemplo completo y verificado de cada pieza está en
[reference.md](reference.md); úsalo como molde y cambia nombres y reglas.

## 0. Alcance

- Identifica el módulo: `identity`, `restaurant`, `catalog`, `order` u otro. Si no existe, se crea
  con la estructura de abajo.
- El modelo de datos todavía se está diseñando. Si la tarea necesita una entidad, un campo o una
  relación que no existe, propón el modelo (campos, tipos, restricciones, relaciones) y espera
  confirmación antes de escribir código.
- Si la tarea toca otro módulo, revisa la sección "Comunicación entre módulos" de
  `docs/arquitectura.md`.

```text
backend/src/main/java/com/nur/pedidos/<modulo>/
├── domain/model/
├── domain/port/
├── domain/exception/
├── application/
└── infrastructure/
    ├── persistence/
    └── web/
```

## 1. Dominio

1. Modelo en `domain/model`: Java puro, solo `@Getter` de Lombok, constructor completo y un método
   de fábrica con nombre del negocio. Los cambios de estado son métodos con intención, sin setters.
2. Las reglas se validan dentro del modelo y se rompen con
   `throw new DomainException("<modulo>.<regla>", "<mensaje en español>")`.
3. Puerto en `domain/port`: interfaz con lo mínimo que el caso de uso necesita. Devuelve `Optional`
   para búsquedas, nunca `null`.
4. Excepción propia en `domain/exception` solo si se reutiliza o necesita otro estado HTTP (por
   ejemplo `XxxNotFoundException extends NotFoundException`).

## 2. Caso de uso

1. Una clase `<Verbo><Sustantivo>UseCase` en `application` con un solo método público `execute`.
2. `@Service`, `@RequiredArgsConstructor`, `@Transactional` (`readOnly = true` si solo lee).
3. Entrada: un `record` `<Verbo><Sustantivo>Command` o tipos simples. Salida: modelo de dominio.

## 3. Persistencia

1. `XxxEntity` (package-private) con `@Entity`, `@Table(name = "<plural_en_snake_case>")`, `@Getter`,
   `@Setter`, `@NoArgsConstructor(access = PROTECTED)`, y los métodos `fromDomain` y `toDomain`.
2. `XxxJpaRepository extends JpaRepository<XxxEntity, Long>` (package-private).
3. `XxxPersistenceAdapter` (`@Component`, package-private) implementa el puerto.
4. Dinero `BigDecimal` con `precision = 12, scale = 2`; fechas `Instant`; relaciones `LAZY`.

## 4. Web

1. `XxxController` (package-private) bajo `/api/v1/<recurso-en-plural>`. Sin lógica: convierte,
   llama al caso de uso, responde.
2. Request como `record` con Bean Validation y `toCommand()`. Response como `record` con
   `static from(...)`.
3. Crear responde `201` con `Location`; eliminar responde `204`. Los errores los convierte
   `GlobalExceptionHandler`; no se capturan excepciones en el controller.

## 5. Tests

| Pieza       | Test                                                                    |
| ----------- | ----------------------------------------------------------------------- |
| Modelo      | Unitario puro: cada regla, el camino feliz y cada forma de romperla     |
| Caso de uso | Unitario con un fake en memoria del puerto (`InMemoryXxxRepository`)    |
| Controller  | `@WebMvcTest` + `MockMvcTester`: éxito, validación (400) y 404/422      |
| Adaptador   | `@DataJpaTest` + Testcontainers: guardar, buscar y cada consulta propia |

Nombres de métodos en inglés describiendo la conducta: `rejectsAnOrderWithoutItems`.

## 6. Verificación

Con Docker encendido:

```bash
cd backend
./mvnw spotless:apply
./mvnw verify
```

En Windows con PowerShell: `.\mvnw.cmd`. Si falla `ArchitectureTest`, se corrige el código, nunca la
regla.

## Checklist

- [ ] El dominio no importa nada de Spring, JPA ni Jackson
- [ ] Un caso de uso por clase, terminado en `UseCase`
- [ ] Ningún controller ni caso de uso recibe o devuelve entidades JPA
- [ ] Los errores de negocio tienen un `code` estable
- [ ] Tests en las cuatro capas que se tocaron
- [ ] Sin comentarios en el código
- [ ] `./mvnw verify` en verde
