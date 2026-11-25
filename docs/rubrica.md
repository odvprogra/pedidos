# Rúbrica: dónde está cada punto y qué test lo prueba

Recorre el checklist de evaluación del enunciado ("Proyecto Final · Plataforma de pedidos de comida",
sección 13). Para cada punto dice dónde está en la app y qué test lo prueba, con el comando para
correrlo en la defensa. La estrategia general está en
[convenciones/testing.md](convenciones/testing.md); lo que queda fuera, en
[pendientes.md](pendientes.md). Para abrir cada test en su línea, en el mismo orden:
[mapa-de-tests.md](mapa-de-tests.md).

## Cómo correr las pruebas

Con Docker encendido. Ningún bloque depende de datos cargados a mano.

El proyecto conserva solo los tests que nombra esta página, más `ArchitectureTest`, que verifica las
capas del backend.

| Qué                               | Dónde       | Comando                     | Cantidad  |
| --------------------------------- | ----------- | --------------------------- | --------- |
| Unitarios e integración (backend) | `backend/`  | `./mvnw verify`             | 632 tests |
| Unitarios y páginas (frontend)    | `frontend/` | `npm test -- --watch=false` | 266 specs |
| E2E en Chrome                     | `e2e/`      | `npm test`                  | 17 tests  |

En Windows con PowerShell, `.\mvnw.cmd` en lugar de `./mvnw`.

Para correr una sola prueba:

| Qué                     | Comando                                                                           |
| ----------------------- | --------------------------------------------------------------------------------- |
| Una clase del backend   | `./mvnw test -Dtest=OrderFlowTest`                                                |
| Un método del backend   | `./mvnw test -Dtest="OrderFlowTest#aCustomerOrdersFromTheMenuOfAnOpenRestaurant"` |
| Un archivo del frontend | `npm test -- --watch=false --include src/app/core/cart/cart.spec.ts`              |
| Un archivo de los E2E   | `npm test -- tests/01-place-order.spec.ts`                                        |
| Un E2E por su título    | `npm test -- -g "E2E 04"`                                                         |
| Los E2E con la ventana  | `npm run test:headed`                                                             |

Las clases del backend están en `backend/src/test/java/com/nur/pedidos/`, los specs del frontend en
`frontend/src/app/` al lado del archivo que prueban y los E2E en `e2e/tests/`.

## Nombres del enunciado y nombres del código

| Enunciado      | Código           | Interfaz       |
| -------------- | ---------------- | -------------- |
| PENDIENTE      | `PLACED`         | Pendiente      |
| ACEPTADO       | `ACCEPTED`       | Aceptado       |
| EN PREPARACIÓN | `IN_PREPARATION` | En preparación |
| LISTO          | `READY`          | Listo          |
| COMPLETADO     | `PICKED_UP`      | Completado     |
| Restaurante    | rol `OWNER`      | Dueño          |
| No disponible  | `soldOut`        | Agotado        |
| Deshabilitado  | `suspended`      | Suspendido     |

Además del flujo mínimo hay dos salidas desde PENDIENTE: `REJECTED` (el dueño rechaza) y `CANCELLED`
(el cliente cancela).

## Funcionalidad

| #   | Punto del checklist                       | Dónde está                                                                                                       | Test que lo prueba                                                                                                                                                                                                                                              |
| --- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Registro de usuario                       | `POST /api/v1/auth/register`, pantalla `/registro`                                                               | `AuthFlowTest#registersReadsTheCurrentAccountAndLogsOut`, `AuthFlowTest#storesTheRegisteredAccountWithItsPasswordHashed`, `AccountTest`, `register-page.spec.ts`                                                                                                |
| 2   | Inicio de sesión                          | `POST /api/v1/auth/login`, pantalla `/ingresar`                                                                  | `AuthFlowTest#replacesTheOpenSessionWhenLoggingInAgain`, `LogInUseCaseTest`, `AuthControllerTest#logsInAndStartsTheSession`, `log-in-page.spec.ts`; todos los E2E ingresan por la pantalla                                                                      |
| 3   | Roles implementados                       | `CUSTOMER`, `OWNER` y `ADMIN`, fijos por cuenta ([ADR-0008](adr/0008-autenticacion-con-sesion-y-roles.md))       | `SecurityConfigTest#rejectsTheWrongRoleWithProblemDetails`, `AccountTest#rejectsTheRegistrationOfAnAdmin`, `auth-guards.spec.ts`, `05-access-control.spec.ts`                                                                                                   |
| 4   | Listado de restaurantes                   | `GET /api/v1/restaurants`, pantalla `/restaurantes`                                                              | `PublicRestaurantControllerTest#listsTheFirstPageOfRestaurantsWithoutSession`, `RestaurantPersistenceAdapterTest#listsTheVisibleRestaurantsWithTheOpenOnesFirst`, `restaurant-list-page.spec.ts`, E2E 01 "the restaurants show their category, logo and status" |
| 5   | Detalle de restaurante                    | `GET /api/v1/restaurants/{id}`, pantalla `/restaurantes/:id`                                                     | `CatalogFlowTest#aVisitorWithoutSessionBrowsesARestaurantAndItsMenu`, `PublicRestaurantControllerTest#returnsAVisibleRestaurantWithoutSession`, `restaurant-profile.spec.ts`                                                                                    |
| 6   | Menú de productos                         | `GET /api/v1/restaurants/{id}/catalog`, la misma pantalla                                                        | `PublicCatalogControllerTest#returnsTheCatalogOfARestaurantWithoutSession`, `GetVisibleCatalogUseCaseTest`, `restaurant-menu-page.spec.ts`, E2E 01                                                                                                              |
| 7   | Creación de productos                     | `POST /api/v1/restaurants/mine/products`, pantalla "Menú" del dueño                                              | `CatalogFlowTest#anOwnerBuildsTheMenuOfTheirRestaurant`, `CreateProductUseCaseTest`, `ProductTest`, `ProductPersistenceAdapterTest#savesAndLoadsAProduct`, `catalog-page.spec.ts` "adds a product to a category"                                                |
| 8   | Edición de productos                      | `PUT /api/v1/restaurants/mine/products/{id}`                                                                     | `EditProductUseCaseTest`, `ProductControllerTest#editsAProductOfTheOwnerInSession`, `ProductPersistenceAdapterTest#keepsTheChangesOfAProduct`, `catalog-page.spec.ts` "edits a product and moves it to another category"                                        |
| 9   | Habilitar/deshabilitar productos          | `POST .../products/{id}/mark-sold-out` y `mark-available`                                                        | `MarkProductSoldOutUseCaseTest`, `MarkProductAvailableUseCaseTest`, `ProductTest#marksAnAvailableProductAsSoldOut`, `catalog-page.spec.ts` "marks a product as sold out", E2E 04 "a sold-out product or a closed restaurant cannot be added"                    |
| 10  | Carrito de compras                        | `frontend/src/app/core/cart`, pantalla `/carrito`                                                                | `cart.spec.ts`, `cart-store.spec.ts`, `cart-page.spec.ts`, E2E 01                                                                                                                                                                                               |
| 11  | Agregar productos al carrito              | Botón "Agregar" del menú                                                                                         | `cart.spec.ts` "adds a new product at the end with one unit", `cart-store.spec.ts` "adds products of the restaurant and stores them", `restaurant-menu-page.spec.ts` "adds products of the restaurant and announces each one"                                   |
| 12  | Modificar cantidades                      | Botones más y menos del carrito                                                                                  | `cart.spec.ts` "sets the quantity %d as %d", `cart-store.spec.ts` "changes the quantity of a product", `cart-page.spec.ts` "updates the subtotal when a quantity changes", E2E 01                                                                               |
| 13  | Eliminar productos                        | Botón "Quitar" del carrito                                                                                       | `cart.spec.ts` "removes a product and keeps the rest", `cart-page.spec.ts` "removes a product, says so and takes the focus to the next one"                                                                                                                     |
| 14  | Cálculo correcto de subtotales            | `lineSubtotal` en el carrito; `OrderItem` en el backend                                                          | `cart.spec.ts` "gives the subtotal of a line", `OrderFlowTest#aCustomerOrdersFromTheMenuOfAnOpenRestaurant` (2 × 45,00 = 90,00 y 3 × 10,50 = 31,50)                                                                                                             |
| 15  | Cálculo correcto del total                | `estimatedSubtotal` en el carrito; `Order.place` en el backend, que es el que vale                               | `cart.spec.ts` "estimates the subtotal in cents so the decimals add up", `OrderTest#calculatesTheTotalAsThePriceTimesTheQuantityOfEachProduct`, `cart-page.spec.ts` "confirms the order with the total of the backend and empties the cart", E2E 01             |
| 16  | Restricción de un restaurante por carrito | `CartStore.add` no mezcla; el menú pregunta antes de reemplazar; el backend rechaza un producto de otro menú     | `cart-store.spec.ts` "does not mix products of another restaurant", `restaurant-menu-page.spec.ts` "asks before replacing a cart of another restaurant", `PlaceOrderUseCaseTest#refusesAProductFromTheMenuOfAnotherRestaurant`, `04-cart-rules.spec.ts`         |
| 17  | Creación de pedidos                       | `POST /api/v1/orders`, botón "Confirmar pedido"                                                                  | `OrderFlowTest#aCustomerOrdersFromTheMenuOfAnOpenRestaurant`, `PlaceOrderUseCaseTest`, `OrderPersistenceAdapterTest#savesAnOrderTogetherWithItsItems`, `01-place-order.spec.ts`                                                                                 |
| 18  | Detalle del pedido                        | `GET /api/v1/orders/{id}`, pantalla `/pedidos/:id`                                                               | `GetCustomerOrderUseCaseTest`, `OrderControllerTest#givesTheCustomerOneOfTheirOrders`, `order-detail-page.spec.ts` "lists the items with their subtotals and the total", `03-order-history.spec.ts`                                                             |
| 19  | Historial de pedidos                      | `GET /api/v1/orders`, pantalla `/pedidos`                                                                        | `ListCustomerOrdersUseCaseTest`, `OrderPersistenceAdapterTest#listsOnlyTheOrdersOfTheCustomerWithTheNewestFirst`, `order-list-page.spec.ts`, `03-order-history.spec.ts`                                                                                         |
| 20  | Gestión de estados del pedido             | `POST /api/v1/restaurants/mine/orders/{id}/accept`, `start-preparing`, `mark-ready`, `mark-picked-up` y `reject` | `OrderFlowTest#anOrderGoesFromPlacedToPickedUpEvenAfterTheRestaurantCloses`, `AcceptOrderUseCaseTest`, `StartPreparingOrderUseCaseTest`, `MarkOrderReadyUseCaseTest`, `MarkOrderPickedUpUseCaseTest`, `orders-page.spec.ts`, `02-manage-order.spec.ts`          |
| 21  | Validación de transiciones de estados     | `Order` en el dominio; responde `409` con `order.invalid_transition`                                             | `OrderTest#movesToTheNextStatusAndRecordsTheTimeOfTheChange`, `OrderTest#refusesAnyOtherTransitionWithoutChangingTheOrder` (todas las combinaciones), `OrderFlowTest#theOwnerCannotAcceptAnOrderTheCustomerAlreadyCancelled`, E2E 02 "cannot skip a step"       |
| 22  | Control de acceso por roles               | `@PreAuthorize` en cada controller, la pertenencia en el caso de uso y los guards del frontend                   | `OrderFlowTest#aCustomerCannotChangeTheStatusOfTheirOwnOrder`, `OrderFlowTest#aVisitorWithoutSessionCannotOrderNorReadOrders`, los `rejects...WithoutSession` y `rejects...FromAnotherRole` de cada `*ControllerTest`, `05-access-control.spec.ts`              |
| 23  | Persistencia en base de datos             | PostgreSQL 17, esquema de Flyway ([modelo-de-datos.md](modelo-de-datos.md))                                      | `AccountPersistenceAdapterTest`, `RestaurantPersistenceAdapterTest`, `CategoryPersistenceAdapterTest`, `ProductPersistenceAdapterTest`, `OrderPersistenceAdapterTest`, todos contra PostgreSQL real con Testcontainers                                          |

Lo que el enunciado pide fuera del checklist:

| Requisito                                                    | Test que lo prueba                                                                                                                                                                                                                                             |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El precio histórico se conserva (Bs 35 → Bs 40)              | `OrderFlowTest#anOrderKeepsThePriceOfTheMomentItWasPlacedWhenTheOwnerChangesIt`                                                                                                                                                                                |
| Un restaurante deshabilitado no recibe pedidos               | `RestaurantSuspensionFlowTest#aSuspendedRestaurantDisappearsForCustomersAndStopsTakingOrders`                                                                                                                                                                  |
| Un producto no disponible se ve, pero no se agrega           | `OrderTest#rejectsASoldOutProduct`, `OrderFlowTest#aCustomerCannotOrderAProductThatSoldOut`, `restaurant-menu-page.spec.ts` "does not let a sold out product be added", E2E 04                                                                                 |
| Un cliente no cambia el estado de un pedido                  | `OrderFlowTest#aCustomerCannotChangeTheStatusOfTheirOwnOrder`, E2E 05 "a customer cannot change the status of an order, even through the API"                                                                                                                  |
| Un cliente solo consulta sus pedidos                         | `OrderFlowTest#aCustomerCannotSeeNorCancelTheOrderOfAnotherCustomer`, E2E 03 "a customer does not see the orders of another customer"                                                                                                                          |
| Las contraseñas no se guardan en texto plano                 | `AuthFlowTest#storesTheRegisteredAccountWithItsPasswordHashed`, `BcryptPasswordHasherTest`, `AccountTest#keepsTheHashInsteadOfThePassword`                                                                                                                     |
| Precio y cantidad mayores a cero, email válido, obligatorios | `ProductTest#rejectsAPriceThatIsNotPositive`, `OrderLinesTest#rejectsAQuantityOutsideOneToNinetyNine`, `AccountTest#rejectsAnEmailWithoutAValidFormat`, `ProductControllerTest#rejectsAProductThatBreaksTheFormat`                                             |
| No se confirma un carrito vacío                              | `OrderLinesTest#rejectsAnOrderWithoutProducts`, E2E 04 "an empty cart cannot be confirmed"                                                                                                                                                                     |
| Errores con códigos HTTP coherentes                          | `OrderControllerTest#answersEachBrokenRuleWithItsCode`, `GlobalExceptionHandlerTest`; el formato está en [convenciones/api.md](convenciones/api.md)                                                                                                            |
| El admin consulta usuarios, restaurantes y pedidos           | `AccountControllerTest#listsTheFirstPageOfAccountsAsAdmin`, `AdminRestaurantControllerTest#listsTheFirstPageOfEveryRestaurantAsAdmin`, `AdminOrderControllerTest#listsTheFirstPageOfEveryOrderAsAdmin`, E2E 05 "the admin sees the orders of every restaurant" |
| El admin habilita y deshabilita restaurantes                 | `RestaurantSuspensionFlowTest`, `SuspendRestaurantUseCaseTest`, `ReactivateRestaurantUseCaseTest`                                                                                                                                                              |
| El restaurante edita su información, con imagen y categoría  | `CatalogFlowTest#anOwnerChangesTheDetailsAndImagesThatVisitorsSee`, `EditRestaurantUseCaseTest`, E2E 02 "the restaurant edits its details and customers see them"                                                                                              |

## Testing

| #   | Punto del checklist                                      | Cómo se cumple                                                                                                                                                                                                                                                                      |
| --- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | El proyecto contiene tests unitarios                     | Backend: los `*Test` de `domain/model` y `application` de cada módulo, sin Spring. Frontend: `core/cart/cart.spec.ts` y `core/cart/cart-store.spec.ts`                                                                                                                              |
| 2   | Los tests unitarios se ejecutan correctamente            | `./mvnw verify` y `npm test -- --watch=false` terminan sin fallas ni tests salteados; la CI corre lo mismo en cada pull request                                                                                                                                                     |
| 3   | Se prueba lógica real del negocio, no getters y setters  | `OrderTest` (total, precio copiado, transiciones), `OrderLinesTest` (cantidades de 1 a 99, producto repetido), `ProductTest`, `AccountTest`, `RestaurantTest`, `cart.spec.ts`                                                                                                       |
| 4   | Se utilizan asserts correctamente                        | AssertJ en el backend (`assertThat`, `assertThatThrownBy` con el código del error) y `expect` de Vitest en el frontend. Una conducta por test, con preparación, acción y verificación separadas                                                                                     |
| 5   | Se utilizan mocks o stubs cuando corresponde             | Fakes en memoria de los puertos (`InMemoryOrderRepository`, `InMemoryProductCatalog`, `FakePasswordHasher`), `@MockitoBean` del caso de uso en los `*ControllerTest`, mock del caso de uso del otro módulo en `ProductCatalogAdapterTest`, y `HttpTestingController` en las páginas |
| 6   | Existen casos positivos y negativos                      | Cada caso de uso tiene el camino feliz y sus rechazos: `PlaceOrderUseCaseTest#savesTheOrderOfTheCustomerAtTheTimeOfTheClock` y `#refusesTheWholeOrderWhenOneProductIsSoldOut`; `OrderTest` con `validTransitions` e `invalidTransitions`                                            |
| 7   | Existen tests de integración                             | `AuthFlowTest`, `CatalogFlowTest`, `OrderFlowTest`, `RestaurantSuspensionFlowTest`, `OrderLockingTest`, `RestaurantLockingTest` (aplicación completa por HTTP) y los `*PersistenceAdapterTest`                                                                                      |
| 8   | Los tests de integración usan un entorno controlado      | Testcontainers levanta un PostgreSQL 17 vacío y Flyway crea el esquema (`TestcontainersConfiguration`). Cada test registra sus cuentas y arma sus datos por la API o por el adaptador                                                                                               |
| 9   | Se prueba persistencia de información                    | Los cinco `*PersistenceAdapterTest`, más `AuthFlowTest#storesTheRegisteredAccountWithItsPasswordHashed`, que lee la fila de `accounts`, y `SecuritySessionsTest` para las sesiones                                                                                                  |
| 10  | Se prueban endpoints de la API                           | Los `*ControllerTest` de la rúbrica (estados HTTP, validación, permisos y Problem Details) y los `*FlowTest`, que llaman a la API real con cookie de sesión y CSRF                                                                                                                 |
| 11  | Se prueba autenticación y autorización                   | `AuthFlowTest`, `SecurityConfigTest`, `OrderFlowTest#aVisitorWithoutSessionCannotOrderNorReadOrders`, `OrderFlowTest#aCustomerCannotChangeTheStatusOfTheirOwnOrder`, `auth-guards.spec.ts`, `unauthorized-interceptor.spec.ts`                                                      |
| 12  | Existen pruebas E2E automatizadas                        | 17 tests de Playwright en `e2e/tests/` ([ADR-0013](adr/0013-pruebas-e2e-con-playwright.md))                                                                                                                                                                                         |
| 13  | Existe E2E de creación de pedido                         | `01-place-order.spec.ts`: "a customer places an order from the menu to the confirmation"                                                                                                                                                                                            |
| 14  | Existe E2E de gestión del pedido                         | `02-manage-order.spec.ts`: "the restaurant takes an order from pending to completed"                                                                                                                                                                                                |
| 15  | Existe E2E de historial de pedidos                       | `03-order-history.spec.ts`: "a customer finds an order in the history and reads its detail"                                                                                                                                                                                         |
| 16  | Existe E2E de reglas y validaciones                      | `04-cart-rules.spec.ts` (dos restaurantes, agotado, cerrado, carrito vacío) y `05-access-control.spec.ts` (sin sesión y con el rol incorrecto)                                                                                                                                      |
| 17  | Los E2E interactúan con la interfaz real                 | Chrome abre el frontend real contra el backend y una base PostgreSQL reales. Los datos de partida se crean por la API (`e2e/support/seed.ts`); lo que cada test prueba se hace con clics y teclado, con selectores por rol y etiqueta                                               |
| 18  | Todos los tests pueden ejecutarse de nuevo en la defensa | Los tres comandos de arriba se repiten las veces que haga falta: Testcontainers crea una base nueva en cada corrida y `npm test` de `e2e/` recrea la base `pedidos_e2e` y levanta su propio backend (8090) y frontend (4210), sin tocar la base de desarrollo                       |

## Los tests que pide el enunciado, uno por uno

### Unitarios (sección 10)

| Pedido                                                   | Test                                                                                                                                                            |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Calcular subtotal y total del carrito                    | `cart.spec.ts`: "gives the subtotal of a line", "estimates the subtotal in cents so the decimals add up"                                                        |
| Agregar, modificar y eliminar productos del carrito      | `cart.spec.ts`: "adds a new product at the end with one unit", "sets the quantity %d as %d", "removes a product and keeps the rest"                             |
| Rechazar cantidades inválidas y productos no disponibles | `OrderLinesTest#rejectsAQuantityOutsideOneToNinetyNine`, `OrderTest#rejectsASoldOutProduct`, `cart.spec.ts` "never goes over the maximum quantity of a product" |
| Impedir productos de diferentes restaurantes             | `cart-store.spec.ts` "does not mix products of another restaurant", `OrderTest#rejectsAProductThatIsNotOnTheMenuOfTheRestaurant`                                |
| Validar transiciones de estados del pedido               | `OrderTest#movesToTheNextStatusAndRecordsTheTimeOfTheChange`, `OrderTest#refusesAnyOtherTransitionWithoutChangingTheOrder`                                      |
| Calcular correctamente el total de un pedido             | `OrderTest#calculatesTheTotalAsThePriceTimesTheQuantityOfEachProduct`                                                                                           |
| Independientes de servicios externos, con mocks o stubs  | Los tests de `domain` y `application` no levantan Spring ni base de datos; los puertos se reemplazan por fakes en memoria                                       |

### Integración (sección 11)

| Pedido                                           | Test                                                                                                                                             |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Registrar un usuario y verificar su persistencia | `AuthFlowTest#storesTheRegisteredAccountWithItsPasswordHashed`, `AccountPersistenceAdapterTest#savesAndLoadsAnAccount`                           |
| Autenticar un usuario                            | `AuthFlowTest#replacesTheOpenSessionWhenLoggingInAgain`, `AuthFlowTest#logsInAsTheAdminCreatedAtStartup`                                         |
| Crear un producto y recuperarlo                  | `CatalogFlowTest#anOwnerBuildsTheMenuOfTheirRestaurant`, `ProductPersistenceAdapterTest#savesAndLoadsAProduct`                                   |
| Crear un pedido y verificar sus detalles         | `OrderFlowTest#aCustomerOrdersFromTheMenuOfAnOpenRestaurant`, `OrderPersistenceAdapterTest#savesAnOrderTogetherWithItsItems`                     |
| Consultar los pedidos de un cliente              | `OrderPersistenceAdapterTest#listsOnlyTheOrdersOfTheCustomerWithTheNewestFirst`, `OrderFlowTest#aCustomerFollowsTheirPendingOrderAndCancelsIt`   |
| Actualizar el estado de un pedido                | `OrderFlowTest#anOrderGoesFromPlacedToPickedUpEvenAfterTheRestaurantCloses`, `OrderPersistenceAdapterTest#savesTheNewStatusAndKeepsTheSameItems` |
| Consultar el pedido de otro usuario              | `OrderFlowTest#aCustomerCannotSeeNorCancelTheOrderOfAnotherCustomer`, `OrderFlowTest#anOwnerCannotSeeNorChangeTheOrdersOfAnotherRestaurant`      |
| Acceso sin autenticación y sin el rol necesario  | `OrderFlowTest#aVisitorWithoutSessionCannotOrderNorReadOrders`, `OrderFlowTest#aCustomerCannotChangeTheStatusOfTheirOwnOrder`                    |
| Entorno controlado, sin datos cargados a mano    | `TestcontainersConfiguration`: PostgreSQL 17 de Docker, vacío, con el esquema de las migraciones                                                 |

### End-to-End (sección 12)

| Flujo                          | Archivo                     | Tests                                                                                                                                 |
| ------------------------------ | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| E2E 01 · Realizar pedido       | `01-place-order.spec.ts`    | 2: el pedido completo hasta la confirmación; el listado y el menú con categoría, logo y fotos                                         |
| E2E 02 · Gestión del pedido    | `02-manage-order.spec.ts`   | 3: de Pendiente a Completado; no se saltea un paso; el dueño edita los datos del local                                                |
| E2E 03 · Historial             | `03-order-history.spec.ts`  | 2: encuentra el pedido y lee productos, total y estado; no ve el pedido de otro cliente                                               |
| E2E 04 · Validación de carrito | `04-cart-rules.spec.ts`     | 4: pregunta antes de mezclar dos restaurantes; reemplaza si el cliente acepta; agotado y cerrado; carrito vacío                       |
| E2E 05 · Control de acceso     | `05-access-control.spec.ts` | 6: sin sesión; cliente y dueño fuera de paneles ajenos; el admin entra y ve los pedidos; el cliente no cambia el estado ni por la API |
