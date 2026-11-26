# Mapa de los tests de la rúbrica

Cada punto del checklist con sus tests y un enlace a la línea donde empieza cada uno, en el mismo
orden que [rubrica.md](rubrica.md). En el editor se abre con Ctrl + clic sobre el enlace; en la
vista previa del Markdown (Ctrl + Shift + V), con un clic. Los comandos para correrlos están en
[rubrica.md](rubrica.md#cómo-correr-las-pruebas).

Un enlace sin número de línea abre la clase o el archivo entero: el punto lo prueba completo.

## Funcionalidad

### 1. Registro de usuario

| Test                                                           | Dónde está                                                                                                                                        |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AuthFlowTest#registersReadsTheCurrentAccountAndLogsOut`       | [backend/…/identity/AuthFlowTest.java:50](../backend/src/test/java/com/nur/pedidos/identity/AuthFlowTest.java#L50)                                |
| `AuthFlowTest#storesTheRegisteredAccountWithItsPasswordHashed` | [backend/…/identity/AuthFlowTest.java:102](../backend/src/test/java/com/nur/pedidos/identity/AuthFlowTest.java#L102)                              |
| `AccountTest`                                                  | [backend/…/identity/domain/model/AccountTest.java](../backend/src/test/java/com/nur/pedidos/identity/domain/model/AccountTest.java)               |
| `register-page.spec.ts`                                        | [frontend/…/features/auth/pages/register-page/register-page.spec.ts](../frontend/src/app/features/auth/pages/register-page/register-page.spec.ts) |

### 2. Inicio de sesión

| Test                                                    | Dónde está                                                                                                                                                             |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AuthFlowTest#replacesTheOpenSessionWhenLoggingInAgain` | [backend/…/identity/AuthFlowTest.java:119](../backend/src/test/java/com/nur/pedidos/identity/AuthFlowTest.java#L119)                                                   |
| `LogInUseCaseTest`                                      | [backend/…/identity/application/LogInUseCaseTest.java](../backend/src/test/java/com/nur/pedidos/identity/application/LogInUseCaseTest.java)                            |
| `AuthControllerTest#logsInAndStartsTheSession`          | [backend/…/identity/infrastructure/web/AuthControllerTest.java:185](../backend/src/test/java/com/nur/pedidos/identity/infrastructure/web/AuthControllerTest.java#L185) |
| `log-in-page.spec.ts`                                   | [frontend/…/features/auth/pages/log-in-page/log-in-page.spec.ts](../frontend/src/app/features/auth/pages/log-in-page/log-in-page.spec.ts)                              |

### 3. Roles implementados

| Test                                                       | Dónde está                                                                                                                                                                 |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SecurityConfigTest#rejectsTheWrongRoleWithProblemDetails` | [backend/…/shared/infrastructure/security/SecurityConfigTest.java:59](../backend/src/test/java/com/nur/pedidos/shared/infrastructure/security/SecurityConfigTest.java#L59) |
| `AccountTest#rejectsTheRegistrationOfAnAdmin`              | [backend/…/identity/domain/model/AccountTest.java:56](../backend/src/test/java/com/nur/pedidos/identity/domain/model/AccountTest.java#L56)                                 |
| `auth-guards.spec.ts`                                      | [frontend/…/core/auth/auth-guards.spec.ts](../frontend/src/app/core/auth/auth-guards.spec.ts)                                                                              |
| `05-access-control.spec.ts`                                | [e2e/tests/05-access-control.spec.ts](../e2e/tests/05-access-control.spec.ts)                                                                                              |

### 4. Listado de restaurantes

| Test                                                                              | Dónde está                                                                                                                                                                                                             |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PublicRestaurantControllerTest#listsTheFirstPageOfRestaurantsWithoutSession`     | [backend/…/restaurant/infrastructure/web/PublicRestaurantControllerTest.java:47](../backend/src/test/java/com/nur/pedidos/restaurant/infrastructure/web/PublicRestaurantControllerTest.java#L47)                       |
| `RestaurantPersistenceAdapterTest#listsTheVisibleRestaurantsWithTheOpenOnesFirst` | [backend/…/restaurant/infrastructure/persistence/RestaurantPersistenceAdapterTest.java:184](../backend/src/test/java/com/nur/pedidos/restaurant/infrastructure/persistence/RestaurantPersistenceAdapterTest.java#L184) |
| `restaurant-list-page.spec.ts`                                                    | [frontend/…/features/restaurants/pages/restaurant-list-page/restaurant-list-page.spec.ts](../frontend/src/app/features/restaurants/pages/restaurant-list-page/restaurant-list-page.spec.ts)                            |
| `01-place-order.spec.ts "the restaurants show their category, logo and status"`   | [e2e/tests/01-place-order.spec.ts:45](../e2e/tests/01-place-order.spec.ts#L45)                                                                                                                                         |

### 5. Detalle de restaurante

| Test                                                                     | Dónde está                                                                                                                                                                                         |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CatalogFlowTest#aVisitorWithoutSessionBrowsesARestaurantAndItsMenu`     | [backend/…/catalog/CatalogFlowTest.java:115](../backend/src/test/java/com/nur/pedidos/catalog/CatalogFlowTest.java#L115)                                                                           |
| `PublicRestaurantControllerTest#returnsAVisibleRestaurantWithoutSession` | [backend/…/restaurant/infrastructure/web/PublicRestaurantControllerTest.java:138](../backend/src/test/java/com/nur/pedidos/restaurant/infrastructure/web/PublicRestaurantControllerTest.java#L138) |
| `restaurant-profile.spec.ts`                                             | [frontend/…/features/restaurants/components/restaurant-profile/restaurant-profile.spec.ts](../frontend/src/app/features/restaurants/components/restaurant-profile/restaurant-profile.spec.ts)      |

### 6. Menú de productos

| Test                                                                       | Dónde está                                                                                                                                                                                  |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PublicCatalogControllerTest#returnsTheCatalogOfARestaurantWithoutSession` | [backend/…/catalog/infrastructure/web/PublicCatalogControllerTest.java:41](../backend/src/test/java/com/nur/pedidos/catalog/infrastructure/web/PublicCatalogControllerTest.java#L41)        |
| `GetVisibleCatalogUseCaseTest`                                             | [backend/…/catalog/application/GetVisibleCatalogUseCaseTest.java](../backend/src/test/java/com/nur/pedidos/catalog/application/GetVisibleCatalogUseCaseTest.java)                           |
| `restaurant-menu-page.spec.ts`                                             | [frontend/…/features/restaurants/pages/restaurant-menu-page/restaurant-menu-page.spec.ts](../frontend/src/app/features/restaurants/pages/restaurant-menu-page/restaurant-menu-page.spec.ts) |
| `E2E 01`                                                                   | [e2e/tests/01-place-order.spec.ts](../e2e/tests/01-place-order.spec.ts)                                                                                                                     |

### 7. Creación de productos

| Test                                                    | Dónde está                                                                                                                                                                                               |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CatalogFlowTest#anOwnerBuildsTheMenuOfTheirRestaurant` | [backend/…/catalog/CatalogFlowTest.java:26](../backend/src/test/java/com/nur/pedidos/catalog/CatalogFlowTest.java#L26)                                                                                   |
| `CreateProductUseCaseTest`                              | [backend/…/catalog/application/CreateProductUseCaseTest.java](../backend/src/test/java/com/nur/pedidos/catalog/application/CreateProductUseCaseTest.java)                                                |
| `ProductTest`                                           | [backend/…/catalog/domain/model/ProductTest.java](../backend/src/test/java/com/nur/pedidos/catalog/domain/model/ProductTest.java)                                                                        |
| `ProductPersistenceAdapterTest#savesAndLoadsAProduct`   | [backend/…/catalog/infrastructure/persistence/ProductPersistenceAdapterTest.java:45](../backend/src/test/java/com/nur/pedidos/catalog/infrastructure/persistence/ProductPersistenceAdapterTest.java#L45) |
| `catalog-page.spec.ts "adds a product to a category"`   | [frontend/…/features/restaurant-admin/pages/catalog-page/catalog-page.spec.ts:465](../frontend/src/app/features/restaurant-admin/pages/catalog-page/catalog-page.spec.ts#L465)                           |

### 8. Edición de productos

| Test                                                                      | Dónde está                                                                                                                                                                                                 |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EditProductUseCaseTest`                                                  | [backend/…/catalog/application/EditProductUseCaseTest.java](../backend/src/test/java/com/nur/pedidos/catalog/application/EditProductUseCaseTest.java)                                                      |
| `ProductControllerTest#editsAProductOfTheOwnerInSession`                  | [backend/…/catalog/infrastructure/web/ProductControllerTest.java:163](../backend/src/test/java/com/nur/pedidos/catalog/infrastructure/web/ProductControllerTest.java#L163)                                 |
| `ProductPersistenceAdapterTest#keepsTheChangesOfAProduct`                 | [backend/…/catalog/infrastructure/persistence/ProductPersistenceAdapterTest.java:116](../backend/src/test/java/com/nur/pedidos/catalog/infrastructure/persistence/ProductPersistenceAdapterTest.java#L116) |
| `catalog-page.spec.ts "edits a product and moves it to another category"` | [frontend/…/features/restaurant-admin/pages/catalog-page/catalog-page.spec.ts:500](../frontend/src/app/features/restaurant-admin/pages/catalog-page/catalog-page.spec.ts#L500)                             |

### 9. Habilitar/deshabilitar productos

| Test                                                                                | Dónde está                                                                                                                                                                     |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `MarkProductSoldOutUseCaseTest`                                                     | [backend/…/catalog/application/MarkProductSoldOutUseCaseTest.java](../backend/src/test/java/com/nur/pedidos/catalog/application/MarkProductSoldOutUseCaseTest.java)            |
| `MarkProductAvailableUseCaseTest`                                                   | [backend/…/catalog/application/MarkProductAvailableUseCaseTest.java](../backend/src/test/java/com/nur/pedidos/catalog/application/MarkProductAvailableUseCaseTest.java)        |
| `ProductTest#marksAnAvailableProductAsSoldOut`                                      | [backend/…/catalog/domain/model/ProductTest.java:179](../backend/src/test/java/com/nur/pedidos/catalog/domain/model/ProductTest.java#L179)                                     |
| `catalog-page.spec.ts "marks a product as sold out"`                                | [frontend/…/features/restaurant-admin/pages/catalog-page/catalog-page.spec.ts:557](../frontend/src/app/features/restaurant-admin/pages/catalog-page/catalog-page.spec.ts#L557) |
| `04-cart-rules.spec.ts "a sold-out product or a closed restaurant cannot be added"` | [e2e/tests/04-cart-rules.spec.ts:50](../e2e/tests/04-cart-rules.spec.ts#L50)                                                                                                   |

### 10. Carrito de compras

| Test                 | Dónde está                                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `cart.spec.ts`       | [frontend/…/core/cart/cart.spec.ts](../frontend/src/app/core/cart/cart.spec.ts)                                                   |
| `cart-store.spec.ts` | [frontend/…/core/cart/cart-store.spec.ts](../frontend/src/app/core/cart/cart-store.spec.ts)                                       |
| `cart-page.spec.ts`  | [frontend/…/features/cart/pages/cart-page/cart-page.spec.ts](../frontend/src/app/features/cart/pages/cart-page/cart-page.spec.ts) |
| `E2E 01`             | [e2e/tests/01-place-order.spec.ts](../e2e/tests/01-place-order.spec.ts)                                                           |

### 11. Agregar productos al carrito

| Test                                                                                    | Dónde está                                                                                                                                                                                           |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cart.spec.ts "adds a new product at the end with one unit"`                            | [frontend/…/core/cart/cart.spec.ts:36](../frontend/src/app/core/cart/cart.spec.ts#L36)                                                                                                               |
| `cart-store.spec.ts "adds products of the restaurant and stores them"`                  | [frontend/…/core/cart/cart-store.spec.ts:54](../frontend/src/app/core/cart/cart-store.spec.ts#L54)                                                                                                   |
| `restaurant-menu-page.spec.ts "adds products of the restaurant and announces each one"` | [frontend/…/features/restaurants/pages/restaurant-menu-page/restaurant-menu-page.spec.ts:407](../frontend/src/app/features/restaurants/pages/restaurant-menu-page/restaurant-menu-page.spec.ts#L407) |

### 12. Modificar cantidades

| Test                                                               | Dónde está                                                                                                                                 |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `cart.spec.ts "sets the quantity %d as %d"`                        | [frontend/…/core/cart/cart.spec.ts:60](../frontend/src/app/core/cart/cart.spec.ts#L60)                                                     |
| `cart-store.spec.ts "changes the quantity of a product"`           | [frontend/…/core/cart/cart-store.spec.ts:92](../frontend/src/app/core/cart/cart-store.spec.ts#L92)                                         |
| `cart-page.spec.ts "updates the subtotal when a quantity changes"` | [frontend/…/features/cart/pages/cart-page/cart-page.spec.ts:155](../frontend/src/app/features/cart/pages/cart-page/cart-page.spec.ts#L155) |
| `E2E 01`                                                           | [e2e/tests/01-place-order.spec.ts](../e2e/tests/01-place-order.spec.ts)                                                                    |

### 13. Eliminar productos

| Test                                                                                 | Dónde está                                                                                                                                 |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `cart.spec.ts "removes a product and keeps the rest"`                                | [frontend/…/core/cart/cart.spec.ts:70](../frontend/src/app/core/cart/cart.spec.ts#L70)                                                     |
| `cart-page.spec.ts "removes a product, says so and takes the focus to the next one"` | [frontend/…/features/cart/pages/cart-page/cart-page.spec.ts:167](../frontend/src/app/features/cart/pages/cart-page/cart-page.spec.ts#L167) |

### 14. Cálculo correcto de subtotales

| Test                                                         | Dónde está                                                                                                     |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `cart.spec.ts "gives the subtotal of a line"`                | [frontend/…/core/cart/cart.spec.ts:92](../frontend/src/app/core/cart/cart.spec.ts#L92)                         |
| `OrderFlowTest#aCustomerOrdersFromTheMenuOfAnOpenRestaurant` | [backend/…/order/OrderFlowTest.java:31](../backend/src/test/java/com/nur/pedidos/order/OrderFlowTest.java#L31) |

### 15. Cálculo correcto del total

| Test                                                                                        | Dónde está                                                                                                                                 |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `cart.spec.ts "estimates the subtotal in cents so the decimals add up"`                     | [frontend/…/core/cart/cart.spec.ts:85](../frontend/src/app/core/cart/cart.spec.ts#L85)                                                     |
| `OrderTest#calculatesTheTotalAsThePriceTimesTheQuantityOfEachProduct`                       | [backend/…/order/domain/model/OrderTest.java:67](../backend/src/test/java/com/nur/pedidos/order/domain/model/OrderTest.java#L67)           |
| `cart-page.spec.ts "confirms the order with the total of the backend and empties the cart"` | [frontend/…/features/cart/pages/cart-page/cart-page.spec.ts:262](../frontend/src/app/features/cart/pages/cart-page/cart-page.spec.ts#L262) |
| `E2E 01`                                                                                    | [e2e/tests/01-place-order.spec.ts](../e2e/tests/01-place-order.spec.ts)                                                                    |

### 16. Restricción de un restaurante por carrito

| Test                                                                                | Dónde está                                                                                                                                                                                           |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cart-store.spec.ts "does not mix products of another restaurant"`                  | [frontend/…/core/cart/cart-store.spec.ts:72](../frontend/src/app/core/cart/cart-store.spec.ts#L72)                                                                                                   |
| `restaurant-menu-page.spec.ts "asks before replacing a cart of another restaurant"` | [frontend/…/features/restaurants/pages/restaurant-menu-page/restaurant-menu-page.spec.ts:498](../frontend/src/app/features/restaurants/pages/restaurant-menu-page/restaurant-menu-page.spec.ts#L498) |
| `PlaceOrderUseCaseTest#refusesAProductFromTheMenuOfAnotherRestaurant`               | [backend/…/order/application/PlaceOrderUseCaseTest.java:83](../backend/src/test/java/com/nur/pedidos/order/application/PlaceOrderUseCaseTest.java#L83)                                               |
| `04-cart-rules.spec.ts`                                                             | [e2e/tests/04-cart-rules.spec.ts](../e2e/tests/04-cart-rules.spec.ts)                                                                                                                                |

### 17. Creación de pedidos

| Test                                                           | Dónde está                                                                                                                                                                                       |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OrderFlowTest#aCustomerOrdersFromTheMenuOfAnOpenRestaurant`   | [backend/…/order/OrderFlowTest.java:31](../backend/src/test/java/com/nur/pedidos/order/OrderFlowTest.java#L31)                                                                                   |
| `PlaceOrderUseCaseTest`                                        | [backend/…/order/application/PlaceOrderUseCaseTest.java](../backend/src/test/java/com/nur/pedidos/order/application/PlaceOrderUseCaseTest.java)                                                  |
| `OrderPersistenceAdapterTest#savesAnOrderTogetherWithItsItems` | [backend/…/order/infrastructure/persistence/OrderPersistenceAdapterTest.java:44](../backend/src/test/java/com/nur/pedidos/order/infrastructure/persistence/OrderPersistenceAdapterTest.java#L44) |
| `01-place-order.spec.ts`                                       | [e2e/tests/01-place-order.spec.ts](../e2e/tests/01-place-order.spec.ts)                                                                                                                          |

### 18. Detalle del pedido

| Test                                                                             | Dónde está                                                                                                                                                                     |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GetCustomerOrderUseCaseTest`                                                    | [backend/…/order/application/GetCustomerOrderUseCaseTest.java](../backend/src/test/java/com/nur/pedidos/order/application/GetCustomerOrderUseCaseTest.java)                    |
| `OrderControllerTest#givesTheCustomerOneOfTheirOrders`                           | [backend/…/order/infrastructure/web/OrderControllerTest.java:281](../backend/src/test/java/com/nur/pedidos/order/infrastructure/web/OrderControllerTest.java#L281)             |
| `order-detail-page.spec.ts "lists the items with their subtotals and the total"` | [frontend/…/features/orders/pages/order-detail-page/order-detail-page.spec.ts:131](../frontend/src/app/features/orders/pages/order-detail-page/order-detail-page.spec.ts#L131) |
| `03-order-history.spec.ts`                                                       | [e2e/tests/03-order-history.spec.ts](../e2e/tests/03-order-history.spec.ts)                                                                                                    |

### 19. Historial de pedidos

| Test                                                                            | Dónde está                                                                                                                                                                                         |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ListCustomerOrdersUseCaseTest`                                                 | [backend/…/order/application/ListCustomerOrdersUseCaseTest.java](../backend/src/test/java/com/nur/pedidos/order/application/ListCustomerOrdersUseCaseTest.java)                                    |
| `OrderPersistenceAdapterTest#listsOnlyTheOrdersOfTheCustomerWithTheNewestFirst` | [backend/…/order/infrastructure/persistence/OrderPersistenceAdapterTest.java:169](../backend/src/test/java/com/nur/pedidos/order/infrastructure/persistence/OrderPersistenceAdapterTest.java#L169) |
| `order-list-page.spec.ts`                                                       | [frontend/…/features/orders/pages/order-list-page/order-list-page.spec.ts](../frontend/src/app/features/orders/pages/order-list-page/order-list-page.spec.ts)                                      |
| `03-order-history.spec.ts`                                                      | [e2e/tests/03-order-history.spec.ts](../e2e/tests/03-order-history.spec.ts)                                                                                                                        |

### 20. Gestión de estados del pedido

| Test                                                                        | Dónde está                                                                                                                                                        |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OrderFlowTest#anOrderGoesFromPlacedToPickedUpEvenAfterTheRestaurantCloses` | [backend/…/order/OrderFlowTest.java:165](../backend/src/test/java/com/nur/pedidos/order/OrderFlowTest.java#L165)                                                  |
| `AcceptOrderUseCaseTest`                                                    | [backend/…/order/application/AcceptOrderUseCaseTest.java](../backend/src/test/java/com/nur/pedidos/order/application/AcceptOrderUseCaseTest.java)                 |
| `StartPreparingOrderUseCaseTest`                                            | [backend/…/order/application/StartPreparingOrderUseCaseTest.java](../backend/src/test/java/com/nur/pedidos/order/application/StartPreparingOrderUseCaseTest.java) |
| `MarkOrderReadyUseCaseTest`                                                 | [backend/…/order/application/MarkOrderReadyUseCaseTest.java](../backend/src/test/java/com/nur/pedidos/order/application/MarkOrderReadyUseCaseTest.java)           |
| `MarkOrderPickedUpUseCaseTest`                                              | [backend/…/order/application/MarkOrderPickedUpUseCaseTest.java](../backend/src/test/java/com/nur/pedidos/order/application/MarkOrderPickedUpUseCaseTest.java)     |
| `orders-page.spec.ts`                                                       | [frontend/…/features/restaurant-admin/pages/orders-page/orders-page.spec.ts](../frontend/src/app/features/restaurant-admin/pages/orders-page/orders-page.spec.ts) |
| `02-manage-order.spec.ts`                                                   | [e2e/tests/02-manage-order.spec.ts](../e2e/tests/02-manage-order.spec.ts)                                                                                         |

### 21. Validación de transiciones de estados

| Test                                                                   | Dónde está                                                                                                                         |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `OrderTest#movesToTheNextStatusAndRecordsTheTimeOfTheChange`           | [backend/…/order/domain/model/OrderTest.java:98](../backend/src/test/java/com/nur/pedidos/order/domain/model/OrderTest.java#L98)   |
| `OrderTest#refusesAnyOtherTransitionWithoutChangingTheOrder`           | [backend/…/order/domain/model/OrderTest.java:110](../backend/src/test/java/com/nur/pedidos/order/domain/model/OrderTest.java#L110) |
| `OrderFlowTest#theOwnerCannotAcceptAnOrderTheCustomerAlreadyCancelled` | [backend/…/order/OrderFlowTest.java:243](../backend/src/test/java/com/nur/pedidos/order/OrderFlowTest.java#L243)                   |
| `02-manage-order.spec.ts "cannot skip a step"`                         | [e2e/tests/02-manage-order.spec.ts:48](../e2e/tests/02-manage-order.spec.ts#L48)                                                   |

### 22. Control de acceso por roles

| Test                                                           | Dónde está                                                                                                                                                                                |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OrderFlowTest#aCustomerCannotChangeTheStatusOfTheirOwnOrder`  | [backend/…/order/OrderFlowTest.java:291](../backend/src/test/java/com/nur/pedidos/order/OrderFlowTest.java#L291)                                                                          |
| `OrderFlowTest#aVisitorWithoutSessionCannotOrderNorReadOrders` | [backend/…/order/OrderFlowTest.java:307](../backend/src/test/java/com/nur/pedidos/order/OrderFlowTest.java#L307)                                                                          |
| `ProductControllerTest`                                        | [backend/…/catalog/infrastructure/web/ProductControllerTest.java](../backend/src/test/java/com/nur/pedidos/catalog/infrastructure/web/ProductControllerTest.java)                         |
| `PublicCatalogControllerTest`                                  | [backend/…/catalog/infrastructure/web/PublicCatalogControllerTest.java](../backend/src/test/java/com/nur/pedidos/catalog/infrastructure/web/PublicCatalogControllerTest.java)             |
| `AccountControllerTest`                                        | [backend/…/identity/infrastructure/web/AccountControllerTest.java](../backend/src/test/java/com/nur/pedidos/identity/infrastructure/web/AccountControllerTest.java)                       |
| `AuthControllerTest`                                           | [backend/…/identity/infrastructure/web/AuthControllerTest.java](../backend/src/test/java/com/nur/pedidos/identity/infrastructure/web/AuthControllerTest.java)                             |
| `AdminOrderControllerTest`                                     | [backend/…/order/infrastructure/web/AdminOrderControllerTest.java](../backend/src/test/java/com/nur/pedidos/order/infrastructure/web/AdminOrderControllerTest.java)                       |
| `OrderControllerTest`                                          | [backend/…/order/infrastructure/web/OrderControllerTest.java](../backend/src/test/java/com/nur/pedidos/order/infrastructure/web/OrderControllerTest.java)                                 |
| `AdminRestaurantControllerTest`                                | [backend/…/restaurant/infrastructure/web/AdminRestaurantControllerTest.java](../backend/src/test/java/com/nur/pedidos/restaurant/infrastructure/web/AdminRestaurantControllerTest.java)   |
| `PublicRestaurantControllerTest`                               | [backend/…/restaurant/infrastructure/web/PublicRestaurantControllerTest.java](../backend/src/test/java/com/nur/pedidos/restaurant/infrastructure/web/PublicRestaurantControllerTest.java) |
| `05-access-control.spec.ts`                                    | [e2e/tests/05-access-control.spec.ts](../e2e/tests/05-access-control.spec.ts)                                                                                                             |

### 23. Persistencia en base de datos

| Test                               | Dónde está                                                                                                                                                                                                    |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AccountPersistenceAdapterTest`    | [backend/…/identity/infrastructure/persistence/AccountPersistenceAdapterTest.java](../backend/src/test/java/com/nur/pedidos/identity/infrastructure/persistence/AccountPersistenceAdapterTest.java)           |
| `RestaurantPersistenceAdapterTest` | [backend/…/restaurant/infrastructure/persistence/RestaurantPersistenceAdapterTest.java](../backend/src/test/java/com/nur/pedidos/restaurant/infrastructure/persistence/RestaurantPersistenceAdapterTest.java) |
| `CategoryPersistenceAdapterTest`   | [backend/…/catalog/infrastructure/persistence/CategoryPersistenceAdapterTest.java](../backend/src/test/java/com/nur/pedidos/catalog/infrastructure/persistence/CategoryPersistenceAdapterTest.java)           |
| `ProductPersistenceAdapterTest`    | [backend/…/catalog/infrastructure/persistence/ProductPersistenceAdapterTest.java](../backend/src/test/java/com/nur/pedidos/catalog/infrastructure/persistence/ProductPersistenceAdapterTest.java)             |
| `OrderPersistenceAdapterTest`      | [backend/…/order/infrastructure/persistence/OrderPersistenceAdapterTest.java](../backend/src/test/java/com/nur/pedidos/order/infrastructure/persistence/OrderPersistenceAdapterTest.java)                     |

### Lo que el enunciado pide fuera del checklist

#### El precio histórico se conserva (Bs 35 → Bs 40)

| Test                                                                            | Dónde está                                                                                                       |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `OrderFlowTest#anOrderKeepsThePriceOfTheMomentItWasPlacedWhenTheOwnerChangesIt` | [backend/…/order/OrderFlowTest.java:202](../backend/src/test/java/com/nur/pedidos/order/OrderFlowTest.java#L202) |

#### Un restaurante deshabilitado no recibe pedidos

| Test                                                                                          | Dónde está                                                                                                                                             |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `RestaurantSuspensionFlowTest#aSuspendedRestaurantDisappearsForCustomersAndStopsTakingOrders` | [backend/…/restaurant/RestaurantSuspensionFlowTest.java:31](../backend/src/test/java/com/nur/pedidos/restaurant/RestaurantSuspensionFlowTest.java#L31) |

#### Un producto no disponible se ve, pero no se agrega

| Test                                                                      | Dónde está                                                                                                                                                                                           |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OrderTest#rejectsASoldOutProduct`                                        | [backend/…/order/domain/model/OrderTest.java:87](../backend/src/test/java/com/nur/pedidos/order/domain/model/OrderTest.java#L87)                                                                     |
| `OrderFlowTest#aCustomerCannotOrderAProductThatSoldOut`                   | [backend/…/order/OrderFlowTest.java:73](../backend/src/test/java/com/nur/pedidos/order/OrderFlowTest.java#L73)                                                                                       |
| `restaurant-menu-page.spec.ts "does not let a sold out product be added"` | [frontend/…/features/restaurants/pages/restaurant-menu-page/restaurant-menu-page.spec.ts:451](../frontend/src/app/features/restaurants/pages/restaurant-menu-page/restaurant-menu-page.spec.ts#L451) |
| `E2E 04`                                                                  | [e2e/tests/04-cart-rules.spec.ts](../e2e/tests/04-cart-rules.spec.ts)                                                                                                                                |

#### Un cliente no cambia el estado de un pedido

| Test                                                                                                | Dónde está                                                                                                       |
| --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `OrderFlowTest#aCustomerCannotChangeTheStatusOfTheirOwnOrder`                                       | [backend/…/order/OrderFlowTest.java:291](../backend/src/test/java/com/nur/pedidos/order/OrderFlowTest.java#L291) |
| `05-access-control.spec.ts "a customer cannot change the status of an order, even through the API"` | [e2e/tests/05-access-control.spec.ts:75](../e2e/tests/05-access-control.spec.ts#L75)                             |

#### Un cliente solo consulta sus pedidos

| Test                                                                                | Dónde está                                                                                                       |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `OrderFlowTest#aCustomerCannotSeeNorCancelTheOrderOfAnotherCustomer`                | [backend/…/order/OrderFlowTest.java:139](../backend/src/test/java/com/nur/pedidos/order/OrderFlowTest.java#L139) |
| `03-order-history.spec.ts "a customer does not see the orders of another customer"` | [e2e/tests/03-order-history.spec.ts:38](../e2e/tests/03-order-history.spec.ts#L38)                               |

#### Las contraseñas no se guardan en texto plano

| Test                                                           | Dónde está                                                                                                                                                                          |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AuthFlowTest#storesTheRegisteredAccountWithItsPasswordHashed` | [backend/…/identity/AuthFlowTest.java:102](../backend/src/test/java/com/nur/pedidos/identity/AuthFlowTest.java#L102)                                                                |
| `BcryptPasswordHasherTest`                                     | [backend/…/identity/infrastructure/security/BcryptPasswordHasherTest.java](../backend/src/test/java/com/nur/pedidos/identity/infrastructure/security/BcryptPasswordHasherTest.java) |
| `AccountTest#keepsTheHashInsteadOfThePassword`                 | [backend/…/identity/domain/model/AccountTest.java:49](../backend/src/test/java/com/nur/pedidos/identity/domain/model/AccountTest.java#L49)                                          |

#### Precio y cantidad mayores a cero, email válido, obligatorios

| Test                                                       | Dónde está                                                                                                                                                               |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ProductTest#rejectsAPriceThatIsNotPositive`               | [backend/…/catalog/domain/model/ProductTest.java:57](../backend/src/test/java/com/nur/pedidos/catalog/domain/model/ProductTest.java#L57)                                 |
| `OrderLinesTest#rejectsAQuantityOutsideOneToNinetyNine`    | [backend/…/order/domain/model/OrderLinesTest.java:31](../backend/src/test/java/com/nur/pedidos/order/domain/model/OrderLinesTest.java#L31)                               |
| `AccountTest#rejectsAnEmailWithoutAValidFormat`            | [backend/…/identity/domain/model/AccountTest.java:85](../backend/src/test/java/com/nur/pedidos/identity/domain/model/AccountTest.java#L85)                               |
| `ProductControllerTest#rejectsAProductThatBreaksTheFormat` | [backend/…/catalog/infrastructure/web/ProductControllerTest.java:97](../backend/src/test/java/com/nur/pedidos/catalog/infrastructure/web/ProductControllerTest.java#L97) |

#### No se confirma un carrito vacío

| Test                                                        | Dónde está                                                                                                                                 |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `OrderLinesTest#rejectsAnOrderWithoutProducts`              | [backend/…/order/domain/model/OrderLinesTest.java:22](../backend/src/test/java/com/nur/pedidos/order/domain/model/OrderLinesTest.java#L22) |
| `04-cart-rules.spec.ts "an empty cart cannot be confirmed"` | [e2e/tests/04-cart-rules.spec.ts:69](../e2e/tests/04-cart-rules.spec.ts#L69)                                                               |

#### Errores con códigos HTTP coherentes

| Test                                                   | Dónde está                                                                                                                                                                |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OrderControllerTest#answersEachBrokenRuleWithItsCode` | [backend/…/order/infrastructure/web/OrderControllerTest.java:145](../backend/src/test/java/com/nur/pedidos/order/infrastructure/web/OrderControllerTest.java#L145)        |
| `GlobalExceptionHandlerTest`                           | [backend/…/shared/infrastructure/web/GlobalExceptionHandlerTest.java](../backend/src/test/java/com/nur/pedidos/shared/infrastructure/web/GlobalExceptionHandlerTest.java) |

#### El admin consulta usuarios, restaurantes y pedidos

| Test                                                                        | Dónde está                                                                                                                                                                                     |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AccountControllerTest#listsTheFirstPageOfAccountsAsAdmin`                  | [backend/…/identity/infrastructure/web/AccountControllerTest.java:52](../backend/src/test/java/com/nur/pedidos/identity/infrastructure/web/AccountControllerTest.java#L52)                     |
| `AdminRestaurantControllerTest#listsTheFirstPageOfEveryRestaurantAsAdmin`   | [backend/…/restaurant/infrastructure/web/AdminRestaurantControllerTest.java:51](../backend/src/test/java/com/nur/pedidos/restaurant/infrastructure/web/AdminRestaurantControllerTest.java#L51) |
| `AdminOrderControllerTest#listsTheFirstPageOfEveryOrderAsAdmin`             | [backend/…/order/infrastructure/web/AdminOrderControllerTest.java:42](../backend/src/test/java/com/nur/pedidos/order/infrastructure/web/AdminOrderControllerTest.java#L42)                     |
| `05-access-control.spec.ts "the admin sees the orders of every restaurant"` | [e2e/tests/05-access-control.spec.ts:55](../e2e/tests/05-access-control.spec.ts#L55)                                                                                                           |

#### El admin habilita y deshabilita restaurantes

| Test                              | Dónde está                                                                                                                                                                    |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RestaurantSuspensionFlowTest`    | [backend/…/restaurant/RestaurantSuspensionFlowTest.java](../backend/src/test/java/com/nur/pedidos/restaurant/RestaurantSuspensionFlowTest.java)                               |
| `SuspendRestaurantUseCaseTest`    | [backend/…/restaurant/application/SuspendRestaurantUseCaseTest.java](../backend/src/test/java/com/nur/pedidos/restaurant/application/SuspendRestaurantUseCaseTest.java)       |
| `ReactivateRestaurantUseCaseTest` | [backend/…/restaurant/application/ReactivateRestaurantUseCaseTest.java](../backend/src/test/java/com/nur/pedidos/restaurant/application/ReactivateRestaurantUseCaseTest.java) |

#### El restaurante edita su información, con imagen y categoría

| Test                                                                                | Dónde está                                                                                                                                                        |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CatalogFlowTest#anOwnerChangesTheDetailsAndImagesThatVisitorsSee`                  | [backend/…/catalog/CatalogFlowTest.java:186](../backend/src/test/java/com/nur/pedidos/catalog/CatalogFlowTest.java#L186)                                          |
| `EditRestaurantUseCaseTest`                                                         | [backend/…/restaurant/application/EditRestaurantUseCaseTest.java](../backend/src/test/java/com/nur/pedidos/restaurant/application/EditRestaurantUseCaseTest.java) |
| `02-manage-order.spec.ts "the restaurant edits its details and customers see them"` | [e2e/tests/02-manage-order.spec.ts:71](../e2e/tests/02-manage-order.spec.ts#L71)                                                                                  |

## Testing

### 1. El proyecto contiene tests unitarios

| Test                              | Dónde está                                                                                                                                                                    |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CreateProductUseCaseTest`        | [backend/…/catalog/application/CreateProductUseCaseTest.java](../backend/src/test/java/com/nur/pedidos/catalog/application/CreateProductUseCaseTest.java)                     |
| `EditProductUseCaseTest`          | [backend/…/catalog/application/EditProductUseCaseTest.java](../backend/src/test/java/com/nur/pedidos/catalog/application/EditProductUseCaseTest.java)                         |
| `GetVisibleCatalogUseCaseTest`    | [backend/…/catalog/application/GetVisibleCatalogUseCaseTest.java](../backend/src/test/java/com/nur/pedidos/catalog/application/GetVisibleCatalogUseCaseTest.java)             |
| `MarkProductAvailableUseCaseTest` | [backend/…/catalog/application/MarkProductAvailableUseCaseTest.java](../backend/src/test/java/com/nur/pedidos/catalog/application/MarkProductAvailableUseCaseTest.java)       |
| `MarkProductSoldOutUseCaseTest`   | [backend/…/catalog/application/MarkProductSoldOutUseCaseTest.java](../backend/src/test/java/com/nur/pedidos/catalog/application/MarkProductSoldOutUseCaseTest.java)           |
| `ProductTest`                     | [backend/…/catalog/domain/model/ProductTest.java](../backend/src/test/java/com/nur/pedidos/catalog/domain/model/ProductTest.java)                                             |
| `LogInUseCaseTest`                | [backend/…/identity/application/LogInUseCaseTest.java](../backend/src/test/java/com/nur/pedidos/identity/application/LogInUseCaseTest.java)                                   |
| `AccountTest`                     | [backend/…/identity/domain/model/AccountTest.java](../backend/src/test/java/com/nur/pedidos/identity/domain/model/AccountTest.java)                                           |
| `AcceptOrderUseCaseTest`          | [backend/…/order/application/AcceptOrderUseCaseTest.java](../backend/src/test/java/com/nur/pedidos/order/application/AcceptOrderUseCaseTest.java)                             |
| `GetCustomerOrderUseCaseTest`     | [backend/…/order/application/GetCustomerOrderUseCaseTest.java](../backend/src/test/java/com/nur/pedidos/order/application/GetCustomerOrderUseCaseTest.java)                   |
| `ListCustomerOrdersUseCaseTest`   | [backend/…/order/application/ListCustomerOrdersUseCaseTest.java](../backend/src/test/java/com/nur/pedidos/order/application/ListCustomerOrdersUseCaseTest.java)               |
| `MarkOrderPickedUpUseCaseTest`    | [backend/…/order/application/MarkOrderPickedUpUseCaseTest.java](../backend/src/test/java/com/nur/pedidos/order/application/MarkOrderPickedUpUseCaseTest.java)                 |
| `MarkOrderReadyUseCaseTest`       | [backend/…/order/application/MarkOrderReadyUseCaseTest.java](../backend/src/test/java/com/nur/pedidos/order/application/MarkOrderReadyUseCaseTest.java)                       |
| `PlaceOrderUseCaseTest`           | [backend/…/order/application/PlaceOrderUseCaseTest.java](../backend/src/test/java/com/nur/pedidos/order/application/PlaceOrderUseCaseTest.java)                               |
| `StartPreparingOrderUseCaseTest`  | [backend/…/order/application/StartPreparingOrderUseCaseTest.java](../backend/src/test/java/com/nur/pedidos/order/application/StartPreparingOrderUseCaseTest.java)             |
| `OrderLinesTest`                  | [backend/…/order/domain/model/OrderLinesTest.java](../backend/src/test/java/com/nur/pedidos/order/domain/model/OrderLinesTest.java)                                           |
| `OrderTest`                       | [backend/…/order/domain/model/OrderTest.java](../backend/src/test/java/com/nur/pedidos/order/domain/model/OrderTest.java)                                                     |
| `EditRestaurantUseCaseTest`       | [backend/…/restaurant/application/EditRestaurantUseCaseTest.java](../backend/src/test/java/com/nur/pedidos/restaurant/application/EditRestaurantUseCaseTest.java)             |
| `ReactivateRestaurantUseCaseTest` | [backend/…/restaurant/application/ReactivateRestaurantUseCaseTest.java](../backend/src/test/java/com/nur/pedidos/restaurant/application/ReactivateRestaurantUseCaseTest.java) |
| `SuspendRestaurantUseCaseTest`    | [backend/…/restaurant/application/SuspendRestaurantUseCaseTest.java](../backend/src/test/java/com/nur/pedidos/restaurant/application/SuspendRestaurantUseCaseTest.java)       |
| `RestaurantTest`                  | [backend/…/restaurant/domain/model/RestaurantTest.java](../backend/src/test/java/com/nur/pedidos/restaurant/domain/model/RestaurantTest.java)                                 |
| `cart.spec.ts`                    | [frontend/…/core/cart/cart.spec.ts](../frontend/src/app/core/cart/cart.spec.ts)                                                                                               |
| `cart-store.spec.ts`              | [frontend/…/core/cart/cart-store.spec.ts](../frontend/src/app/core/cart/cart-store.spec.ts)                                                                                   |

### 2. Los tests unitarios se ejecutan correctamente

Sin un test propio: `./mvnw verify` y `npm test -- --watch=false` terminan sin fallas ni tests
salteados; la CI corre lo mismo en cada pull request

### 3. Se prueba lógica real del negocio, no getters y setters

| Test             | Dónde está                                                                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `OrderTest`      | [backend/…/order/domain/model/OrderTest.java](../backend/src/test/java/com/nur/pedidos/order/domain/model/OrderTest.java)                     |
| `OrderLinesTest` | [backend/…/order/domain/model/OrderLinesTest.java](../backend/src/test/java/com/nur/pedidos/order/domain/model/OrderLinesTest.java)           |
| `ProductTest`    | [backend/…/catalog/domain/model/ProductTest.java](../backend/src/test/java/com/nur/pedidos/catalog/domain/model/ProductTest.java)             |
| `AccountTest`    | [backend/…/identity/domain/model/AccountTest.java](../backend/src/test/java/com/nur/pedidos/identity/domain/model/AccountTest.java)           |
| `RestaurantTest` | [backend/…/restaurant/domain/model/RestaurantTest.java](../backend/src/test/java/com/nur/pedidos/restaurant/domain/model/RestaurantTest.java) |
| `cart.spec.ts`   | [frontend/…/core/cart/cart.spec.ts](../frontend/src/app/core/cart/cart.spec.ts)                                                               |

### 4. Se utilizan asserts correctamente

Sin un test propio: AssertJ en el backend (`assertThat`, `assertThatThrownBy` con el código del
error) y `expect` de Vitest en el frontend. Una conducta por test, con preparación, acción y
verificación separadas

### 5. Se utilizan mocks o stubs cuando corresponde

| Test                             | Dónde está                                                                                                                                                                                |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `InMemoryOrderRepository`        | [backend/…/order/application/InMemoryOrderRepository.java](../backend/src/test/java/com/nur/pedidos/order/application/InMemoryOrderRepository.java)                                       |
| `InMemoryProductCatalog`         | [backend/…/order/application/InMemoryProductCatalog.java](../backend/src/test/java/com/nur/pedidos/order/application/InMemoryProductCatalog.java)                                         |
| `FakePasswordHasher`             | [backend/…/identity/domain/port/FakePasswordHasher.java](../backend/src/test/java/com/nur/pedidos/identity/domain/port/FakePasswordHasher.java)                                           |
| `ProductControllerTest`          | [backend/…/catalog/infrastructure/web/ProductControllerTest.java](../backend/src/test/java/com/nur/pedidos/catalog/infrastructure/web/ProductControllerTest.java)                         |
| `PublicCatalogControllerTest`    | [backend/…/catalog/infrastructure/web/PublicCatalogControllerTest.java](../backend/src/test/java/com/nur/pedidos/catalog/infrastructure/web/PublicCatalogControllerTest.java)             |
| `AccountControllerTest`          | [backend/…/identity/infrastructure/web/AccountControllerTest.java](../backend/src/test/java/com/nur/pedidos/identity/infrastructure/web/AccountControllerTest.java)                       |
| `AuthControllerTest`             | [backend/…/identity/infrastructure/web/AuthControllerTest.java](../backend/src/test/java/com/nur/pedidos/identity/infrastructure/web/AuthControllerTest.java)                             |
| `AdminOrderControllerTest`       | [backend/…/order/infrastructure/web/AdminOrderControllerTest.java](../backend/src/test/java/com/nur/pedidos/order/infrastructure/web/AdminOrderControllerTest.java)                       |
| `OrderControllerTest`            | [backend/…/order/infrastructure/web/OrderControllerTest.java](../backend/src/test/java/com/nur/pedidos/order/infrastructure/web/OrderControllerTest.java)                                 |
| `AdminRestaurantControllerTest`  | [backend/…/restaurant/infrastructure/web/AdminRestaurantControllerTest.java](../backend/src/test/java/com/nur/pedidos/restaurant/infrastructure/web/AdminRestaurantControllerTest.java)   |
| `PublicRestaurantControllerTest` | [backend/…/restaurant/infrastructure/web/PublicRestaurantControllerTest.java](../backend/src/test/java/com/nur/pedidos/restaurant/infrastructure/web/PublicRestaurantControllerTest.java) |
| `ProductCatalogAdapterTest`      | [backend/…/order/infrastructure/catalog/ProductCatalogAdapterTest.java](../backend/src/test/java/com/nur/pedidos/order/infrastructure/catalog/ProductCatalogAdapterTest.java)             |

### 6. Existen casos positivos y negativos

| Test                                                                  | Dónde está                                                                                                                                             |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `PlaceOrderUseCaseTest#savesTheOrderOfTheCustomerAtTheTimeOfTheClock` | [backend/…/order/application/PlaceOrderUseCaseTest.java:49](../backend/src/test/java/com/nur/pedidos/order/application/PlaceOrderUseCaseTest.java#L49) |
| `PlaceOrderUseCaseTest#refusesTheWholeOrderWhenOneProductIsSoldOut`   | [backend/…/order/application/PlaceOrderUseCaseTest.java:95](../backend/src/test/java/com/nur/pedidos/order/application/PlaceOrderUseCaseTest.java#L95) |
| `OrderTest`                                                           | [backend/…/order/domain/model/OrderTest.java](../backend/src/test/java/com/nur/pedidos/order/domain/model/OrderTest.java)                              |
| `OrderTest#validTransitions`                                          | [backend/…/order/domain/model/OrderTest.java:146](../backend/src/test/java/com/nur/pedidos/order/domain/model/OrderTest.java#L146)                     |
| `OrderTest#invalidTransitions`                                        | [backend/…/order/domain/model/OrderTest.java:156](../backend/src/test/java/com/nur/pedidos/order/domain/model/OrderTest.java#L156)                     |

### 7. Existen tests de integración

| Test                               | Dónde está                                                                                                                                                                                                    |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AuthFlowTest`                     | [backend/…/identity/AuthFlowTest.java](../backend/src/test/java/com/nur/pedidos/identity/AuthFlowTest.java)                                                                                                   |
| `CatalogFlowTest`                  | [backend/…/catalog/CatalogFlowTest.java](../backend/src/test/java/com/nur/pedidos/catalog/CatalogFlowTest.java)                                                                                               |
| `OrderFlowTest`                    | [backend/…/order/OrderFlowTest.java](../backend/src/test/java/com/nur/pedidos/order/OrderFlowTest.java)                                                                                                       |
| `RestaurantSuspensionFlowTest`     | [backend/…/restaurant/RestaurantSuspensionFlowTest.java](../backend/src/test/java/com/nur/pedidos/restaurant/RestaurantSuspensionFlowTest.java)                                                               |
| `OrderLockingTest`                 | [backend/…/order/OrderLockingTest.java](../backend/src/test/java/com/nur/pedidos/order/OrderLockingTest.java)                                                                                                 |
| `RestaurantLockingTest`            | [backend/…/restaurant/RestaurantLockingTest.java](../backend/src/test/java/com/nur/pedidos/restaurant/RestaurantLockingTest.java)                                                                             |
| `CategoryPersistenceAdapterTest`   | [backend/…/catalog/infrastructure/persistence/CategoryPersistenceAdapterTest.java](../backend/src/test/java/com/nur/pedidos/catalog/infrastructure/persistence/CategoryPersistenceAdapterTest.java)           |
| `ProductPersistenceAdapterTest`    | [backend/…/catalog/infrastructure/persistence/ProductPersistenceAdapterTest.java](../backend/src/test/java/com/nur/pedidos/catalog/infrastructure/persistence/ProductPersistenceAdapterTest.java)             |
| `AccountPersistenceAdapterTest`    | [backend/…/identity/infrastructure/persistence/AccountPersistenceAdapterTest.java](../backend/src/test/java/com/nur/pedidos/identity/infrastructure/persistence/AccountPersistenceAdapterTest.java)           |
| `OrderPersistenceAdapterTest`      | [backend/…/order/infrastructure/persistence/OrderPersistenceAdapterTest.java](../backend/src/test/java/com/nur/pedidos/order/infrastructure/persistence/OrderPersistenceAdapterTest.java)                     |
| `RestaurantPersistenceAdapterTest` | [backend/…/restaurant/infrastructure/persistence/RestaurantPersistenceAdapterTest.java](../backend/src/test/java/com/nur/pedidos/restaurant/infrastructure/persistence/RestaurantPersistenceAdapterTest.java) |

### 8. Los tests de integración usan un entorno controlado

| Test                          | Dónde está                                                                                                              |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `TestcontainersConfiguration` | [backend/…/TestcontainersConfiguration.java](../backend/src/test/java/com/nur/pedidos/TestcontainersConfiguration.java) |

### 9. Se prueba persistencia de información

| Test                                                           | Dónde está                                                                                                                                                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CategoryPersistenceAdapterTest`                               | [backend/…/catalog/infrastructure/persistence/CategoryPersistenceAdapterTest.java](../backend/src/test/java/com/nur/pedidos/catalog/infrastructure/persistence/CategoryPersistenceAdapterTest.java)           |
| `ProductPersistenceAdapterTest`                                | [backend/…/catalog/infrastructure/persistence/ProductPersistenceAdapterTest.java](../backend/src/test/java/com/nur/pedidos/catalog/infrastructure/persistence/ProductPersistenceAdapterTest.java)             |
| `AccountPersistenceAdapterTest`                                | [backend/…/identity/infrastructure/persistence/AccountPersistenceAdapterTest.java](../backend/src/test/java/com/nur/pedidos/identity/infrastructure/persistence/AccountPersistenceAdapterTest.java)           |
| `OrderPersistenceAdapterTest`                                  | [backend/…/order/infrastructure/persistence/OrderPersistenceAdapterTest.java](../backend/src/test/java/com/nur/pedidos/order/infrastructure/persistence/OrderPersistenceAdapterTest.java)                     |
| `RestaurantPersistenceAdapterTest`                             | [backend/…/restaurant/infrastructure/persistence/RestaurantPersistenceAdapterTest.java](../backend/src/test/java/com/nur/pedidos/restaurant/infrastructure/persistence/RestaurantPersistenceAdapterTest.java) |
| `AuthFlowTest#storesTheRegisteredAccountWithItsPasswordHashed` | [backend/…/identity/AuthFlowTest.java:102](../backend/src/test/java/com/nur/pedidos/identity/AuthFlowTest.java#L102)                                                                                          |
| `SecuritySessionsTest`                                         | [backend/…/shared/infrastructure/security/SecuritySessionsTest.java](../backend/src/test/java/com/nur/pedidos/shared/infrastructure/security/SecuritySessionsTest.java)                                       |

### 10. Se prueban endpoints de la API

| Test                             | Dónde está                                                                                                                                                                                |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ProductControllerTest`          | [backend/…/catalog/infrastructure/web/ProductControllerTest.java](../backend/src/test/java/com/nur/pedidos/catalog/infrastructure/web/ProductControllerTest.java)                         |
| `PublicCatalogControllerTest`    | [backend/…/catalog/infrastructure/web/PublicCatalogControllerTest.java](../backend/src/test/java/com/nur/pedidos/catalog/infrastructure/web/PublicCatalogControllerTest.java)             |
| `AccountControllerTest`          | [backend/…/identity/infrastructure/web/AccountControllerTest.java](../backend/src/test/java/com/nur/pedidos/identity/infrastructure/web/AccountControllerTest.java)                       |
| `AuthControllerTest`             | [backend/…/identity/infrastructure/web/AuthControllerTest.java](../backend/src/test/java/com/nur/pedidos/identity/infrastructure/web/AuthControllerTest.java)                             |
| `AdminOrderControllerTest`       | [backend/…/order/infrastructure/web/AdminOrderControllerTest.java](../backend/src/test/java/com/nur/pedidos/order/infrastructure/web/AdminOrderControllerTest.java)                       |
| `OrderControllerTest`            | [backend/…/order/infrastructure/web/OrderControllerTest.java](../backend/src/test/java/com/nur/pedidos/order/infrastructure/web/OrderControllerTest.java)                                 |
| `AdminRestaurantControllerTest`  | [backend/…/restaurant/infrastructure/web/AdminRestaurantControllerTest.java](../backend/src/test/java/com/nur/pedidos/restaurant/infrastructure/web/AdminRestaurantControllerTest.java)   |
| `PublicRestaurantControllerTest` | [backend/…/restaurant/infrastructure/web/PublicRestaurantControllerTest.java](../backend/src/test/java/com/nur/pedidos/restaurant/infrastructure/web/PublicRestaurantControllerTest.java) |
| `CatalogFlowTest`                | [backend/…/catalog/CatalogFlowTest.java](../backend/src/test/java/com/nur/pedidos/catalog/CatalogFlowTest.java)                                                                           |
| `AuthFlowTest`                   | [backend/…/identity/AuthFlowTest.java](../backend/src/test/java/com/nur/pedidos/identity/AuthFlowTest.java)                                                                               |
| `OrderFlowTest`                  | [backend/…/order/OrderFlowTest.java](../backend/src/test/java/com/nur/pedidos/order/OrderFlowTest.java)                                                                                   |
| `RestaurantSuspensionFlowTest`   | [backend/…/restaurant/RestaurantSuspensionFlowTest.java](../backend/src/test/java/com/nur/pedidos/restaurant/RestaurantSuspensionFlowTest.java)                                           |

### 11. Se prueba autenticación y autorización

| Test                                                           | Dónde está                                                                                                                                                          |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AuthFlowTest`                                                 | [backend/…/identity/AuthFlowTest.java](../backend/src/test/java/com/nur/pedidos/identity/AuthFlowTest.java)                                                         |
| `SecurityConfigTest`                                           | [backend/…/shared/infrastructure/security/SecurityConfigTest.java](../backend/src/test/java/com/nur/pedidos/shared/infrastructure/security/SecurityConfigTest.java) |
| `OrderFlowTest#aVisitorWithoutSessionCannotOrderNorReadOrders` | [backend/…/order/OrderFlowTest.java:307](../backend/src/test/java/com/nur/pedidos/order/OrderFlowTest.java#L307)                                                    |
| `OrderFlowTest#aCustomerCannotChangeTheStatusOfTheirOwnOrder`  | [backend/…/order/OrderFlowTest.java:291](../backend/src/test/java/com/nur/pedidos/order/OrderFlowTest.java#L291)                                                    |
| `auth-guards.spec.ts`                                          | [frontend/…/core/auth/auth-guards.spec.ts](../frontend/src/app/core/auth/auth-guards.spec.ts)                                                                       |
| `unauthorized-interceptor.spec.ts`                             | [frontend/…/core/auth/unauthorized-interceptor.spec.ts](../frontend/src/app/core/auth/unauthorized-interceptor.spec.ts)                                             |

### 12. Existen pruebas E2E automatizadas

Sin un test propio: 17 tests de Playwright en `e2e/tests/`
([ADR-0013](adr/0013-pruebas-e2e-con-playwright.md))

### 13. Existe E2E de creación de pedido

| Test                                                                                    | Dónde está                                                                   |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `01-place-order.spec.ts "a customer places an order from the menu to the confirmation"` | [e2e/tests/01-place-order.spec.ts:6](../e2e/tests/01-place-order.spec.ts#L6) |

### 14. Existe E2E de gestión del pedido

| Test                                                                                | Dónde está                                                                     |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `02-manage-order.spec.ts "the restaurant takes an order from pending to completed"` | [e2e/tests/02-manage-order.spec.ts:5](../e2e/tests/02-manage-order.spec.ts#L5) |

### 15. Existe E2E de historial de pedidos

| Test                                                                                       | Dónde está                                                                       |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `03-order-history.spec.ts "a customer finds an order in the history and reads its detail"` | [e2e/tests/03-order-history.spec.ts:5](../e2e/tests/03-order-history.spec.ts#L5) |

### 16. Existe E2E de reglas y validaciones

| Test                        | Dónde está                                                                    |
| --------------------------- | ----------------------------------------------------------------------------- |
| `04-cart-rules.spec.ts`     | [e2e/tests/04-cart-rules.spec.ts](../e2e/tests/04-cart-rules.spec.ts)         |
| `05-access-control.spec.ts` | [e2e/tests/05-access-control.spec.ts](../e2e/tests/05-access-control.spec.ts) |

### 17. Los E2E interactúan con la interfaz real

Sin un test propio: Chrome abre el frontend real contra el backend y una base PostgreSQL reales. Los
datos de partida se crean por la API (`e2e/support/seed.ts`); lo que cada test prueba se hace con
clics y teclado, con selectores por rol y etiqueta

### 18. Todos los tests pueden ejecutarse de nuevo en la defensa

Sin un test propio: Los tres comandos de arriba se repiten las veces que haga falta: Testcontainers
crea una base nueva en cada corrida y `npm test` de `e2e/` recrea la base `pedidos_e2e` y levanta su
propio backend (8090) y frontend (4210), sin tocar la base de desarrollo

## Unitarios (sección 10)

### Calcular subtotal y total del carrito

| Test                                                                    | Dónde está                                                                             |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `cart.spec.ts "gives the subtotal of a line"`                           | [frontend/…/core/cart/cart.spec.ts:92](../frontend/src/app/core/cart/cart.spec.ts#L92) |
| `cart.spec.ts "estimates the subtotal in cents so the decimals add up"` | [frontend/…/core/cart/cart.spec.ts:85](../frontend/src/app/core/cart/cart.spec.ts#L85) |

### Agregar, modificar y eliminar productos del carrito

| Test                                                         | Dónde está                                                                             |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| `cart.spec.ts "adds a new product at the end with one unit"` | [frontend/…/core/cart/cart.spec.ts:36](../frontend/src/app/core/cart/cart.spec.ts#L36) |
| `cart.spec.ts "sets the quantity %d as %d"`                  | [frontend/…/core/cart/cart.spec.ts:60](../frontend/src/app/core/cart/cart.spec.ts#L60) |
| `cart.spec.ts "removes a product and keeps the rest"`        | [frontend/…/core/cart/cart.spec.ts:70](../frontend/src/app/core/cart/cart.spec.ts#L70) |

### Rechazar cantidades inválidas y productos no disponibles

| Test                                                               | Dónde está                                                                                                                                 |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `OrderLinesTest#rejectsAQuantityOutsideOneToNinetyNine`            | [backend/…/order/domain/model/OrderLinesTest.java:31](../backend/src/test/java/com/nur/pedidos/order/domain/model/OrderLinesTest.java#L31) |
| `OrderTest#rejectsASoldOutProduct`                                 | [backend/…/order/domain/model/OrderTest.java:87](../backend/src/test/java/com/nur/pedidos/order/domain/model/OrderTest.java#L87)           |
| `cart.spec.ts "never goes over the maximum quantity of a product"` | [frontend/…/core/cart/cart.spec.ts:48](../frontend/src/app/core/cart/cart.spec.ts#L48)                                                     |

### Impedir productos de diferentes restaurantes

| Test                                                               | Dónde está                                                                                                                       |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `cart-store.spec.ts "does not mix products of another restaurant"` | [frontend/…/core/cart/cart-store.spec.ts:72](../frontend/src/app/core/cart/cart-store.spec.ts#L72)                               |
| `OrderTest#rejectsAProductThatIsNotOnTheMenuOfTheRestaurant`       | [backend/…/order/domain/model/OrderTest.java:77](../backend/src/test/java/com/nur/pedidos/order/domain/model/OrderTest.java#L77) |

### Validar transiciones de estados del pedido

| Test                                                         | Dónde está                                                                                                                         |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `OrderTest#movesToTheNextStatusAndRecordsTheTimeOfTheChange` | [backend/…/order/domain/model/OrderTest.java:98](../backend/src/test/java/com/nur/pedidos/order/domain/model/OrderTest.java#L98)   |
| `OrderTest#refusesAnyOtherTransitionWithoutChangingTheOrder` | [backend/…/order/domain/model/OrderTest.java:110](../backend/src/test/java/com/nur/pedidos/order/domain/model/OrderTest.java#L110) |

### Calcular correctamente el total de un pedido

| Test                                                                  | Dónde está                                                                                                                       |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `OrderTest#calculatesTheTotalAsThePriceTimesTheQuantityOfEachProduct` | [backend/…/order/domain/model/OrderTest.java:67](../backend/src/test/java/com/nur/pedidos/order/domain/model/OrderTest.java#L67) |

### Independientes de servicios externos, con mocks o stubs

Sin un test propio: Los tests de `domain` y `application` no levantan Spring ni base de datos; los
puertos se reemplazan por fakes en memoria

## Integración (sección 11)

### Registrar un usuario y verificar su persistencia

| Test                                                           | Dónde está                                                                                                                                                                                                 |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AuthFlowTest#storesTheRegisteredAccountWithItsPasswordHashed` | [backend/…/identity/AuthFlowTest.java:102](../backend/src/test/java/com/nur/pedidos/identity/AuthFlowTest.java#L102)                                                                                       |
| `AccountPersistenceAdapterTest#savesAndLoadsAnAccount`         | [backend/…/identity/infrastructure/persistence/AccountPersistenceAdapterTest.java:33](../backend/src/test/java/com/nur/pedidos/identity/infrastructure/persistence/AccountPersistenceAdapterTest.java#L33) |

### Autenticar un usuario

| Test                                                    | Dónde está                                                                                                           |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `AuthFlowTest#replacesTheOpenSessionWhenLoggingInAgain` | [backend/…/identity/AuthFlowTest.java:119](../backend/src/test/java/com/nur/pedidos/identity/AuthFlowTest.java#L119) |
| `AuthFlowTest#logsInAsTheAdminCreatedAtStartup`         | [backend/…/identity/AuthFlowTest.java:162](../backend/src/test/java/com/nur/pedidos/identity/AuthFlowTest.java#L162) |

### Crear un producto y recuperarlo

| Test                                                    | Dónde está                                                                                                                                                                                               |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CatalogFlowTest#anOwnerBuildsTheMenuOfTheirRestaurant` | [backend/…/catalog/CatalogFlowTest.java:26](../backend/src/test/java/com/nur/pedidos/catalog/CatalogFlowTest.java#L26)                                                                                   |
| `ProductPersistenceAdapterTest#savesAndLoadsAProduct`   | [backend/…/catalog/infrastructure/persistence/ProductPersistenceAdapterTest.java:45](../backend/src/test/java/com/nur/pedidos/catalog/infrastructure/persistence/ProductPersistenceAdapterTest.java#L45) |

### Crear un pedido y verificar sus detalles

| Test                                                           | Dónde está                                                                                                                                                                                       |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OrderFlowTest#aCustomerOrdersFromTheMenuOfAnOpenRestaurant`   | [backend/…/order/OrderFlowTest.java:31](../backend/src/test/java/com/nur/pedidos/order/OrderFlowTest.java#L31)                                                                                   |
| `OrderPersistenceAdapterTest#savesAnOrderTogetherWithItsItems` | [backend/…/order/infrastructure/persistence/OrderPersistenceAdapterTest.java:44](../backend/src/test/java/com/nur/pedidos/order/infrastructure/persistence/OrderPersistenceAdapterTest.java#L44) |

### Consultar los pedidos de un cliente

| Test                                                                            | Dónde está                                                                                                                                                                                         |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OrderPersistenceAdapterTest#listsOnlyTheOrdersOfTheCustomerWithTheNewestFirst` | [backend/…/order/infrastructure/persistence/OrderPersistenceAdapterTest.java:169](../backend/src/test/java/com/nur/pedidos/order/infrastructure/persistence/OrderPersistenceAdapterTest.java#L169) |
| `OrderFlowTest#aCustomerFollowsTheirPendingOrderAndCancelsIt`                   | [backend/…/order/OrderFlowTest.java:102](../backend/src/test/java/com/nur/pedidos/order/OrderFlowTest.java#L102)                                                                                   |

### Actualizar el estado de un pedido

| Test                                                                        | Dónde está                                                                                                                                                                                         |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OrderFlowTest#anOrderGoesFromPlacedToPickedUpEvenAfterTheRestaurantCloses` | [backend/…/order/OrderFlowTest.java:165](../backend/src/test/java/com/nur/pedidos/order/OrderFlowTest.java#L165)                                                                                   |
| `OrderPersistenceAdapterTest#savesTheNewStatusAndKeepsTheSameItems`         | [backend/…/order/infrastructure/persistence/OrderPersistenceAdapterTest.java:132](../backend/src/test/java/com/nur/pedidos/order/infrastructure/persistence/OrderPersistenceAdapterTest.java#L132) |

### Consultar el pedido de otro usuario

| Test                                                                  | Dónde está                                                                                                       |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `OrderFlowTest#aCustomerCannotSeeNorCancelTheOrderOfAnotherCustomer`  | [backend/…/order/OrderFlowTest.java:139](../backend/src/test/java/com/nur/pedidos/order/OrderFlowTest.java#L139) |
| `OrderFlowTest#anOwnerCannotSeeNorChangeTheOrdersOfAnotherRestaurant` | [backend/…/order/OrderFlowTest.java:261](../backend/src/test/java/com/nur/pedidos/order/OrderFlowTest.java#L261) |

### Acceso sin autenticación y sin el rol necesario

| Test                                                           | Dónde está                                                                                                       |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `OrderFlowTest#aVisitorWithoutSessionCannotOrderNorReadOrders` | [backend/…/order/OrderFlowTest.java:307](../backend/src/test/java/com/nur/pedidos/order/OrderFlowTest.java#L307) |
| `OrderFlowTest#aCustomerCannotChangeTheStatusOfTheirOwnOrder`  | [backend/…/order/OrderFlowTest.java:291](../backend/src/test/java/com/nur/pedidos/order/OrderFlowTest.java#L291) |

### Entorno controlado, sin datos cargados a mano

| Test                          | Dónde está                                                                                                              |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `TestcontainersConfiguration` | [backend/…/TestcontainersConfiguration.java](../backend/src/test/java/com/nur/pedidos/TestcontainersConfiguration.java) |

## End-to-End (sección 12)

### E2E 01 · Realizar pedido

| Test                                                                                     | Dónde está                                                                     |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `E2E 01 · a customer places an order from the menu to the confirmation`                  | [e2e/tests/01-place-order.spec.ts:6](../e2e/tests/01-place-order.spec.ts#L6)   |
| `E2E 01 · the restaurants show their category, logo and status, and the menu its photos` | [e2e/tests/01-place-order.spec.ts:45](../e2e/tests/01-place-order.spec.ts#L45) |

### E2E 02 · Gestión del pedido

| Test                                                               | Dónde está                                                                       |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `E2E 02 · the restaurant takes an order from pending to completed` | [e2e/tests/02-manage-order.spec.ts:5](../e2e/tests/02-manage-order.spec.ts#L5)   |
| `E2E 02 · the restaurant cannot skip a step of the order`          | [e2e/tests/02-manage-order.spec.ts:48](../e2e/tests/02-manage-order.spec.ts#L48) |
| `E2E 02 · the restaurant edits its details and customers see them` | [e2e/tests/02-manage-order.spec.ts:71](../e2e/tests/02-manage-order.spec.ts#L71) |

### E2E 03 · Historial

| Test                                                                     | Dónde está                                                                         |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `E2E 03 · a customer finds an order in the history and reads its detail` | [e2e/tests/03-order-history.spec.ts:5](../e2e/tests/03-order-history.spec.ts#L5)   |
| `E2E 03 · a customer does not see the orders of another customer`        | [e2e/tests/03-order-history.spec.ts:38](../e2e/tests/03-order-history.spec.ts#L38) |

### E2E 04 · Validación de carrito

| Test                                                                                | Dónde está                                                                   |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `E2E 04 · the cart asks before mixing products of two restaurants`                  | [e2e/tests/04-cart-rules.spec.ts:22](../e2e/tests/04-cart-rules.spec.ts#L22) |
| `E2E 04 · the cart starts again with the other restaurant when the customer agrees` | [e2e/tests/04-cart-rules.spec.ts:36](../e2e/tests/04-cart-rules.spec.ts#L36) |
| `E2E 04 · a sold-out product or a closed restaurant cannot be added`                | [e2e/tests/04-cart-rules.spec.ts:50](../e2e/tests/04-cart-rules.spec.ts#L50) |
| `E2E 04 · an empty cart cannot be confirmed`                                        | [e2e/tests/04-cart-rules.spec.ts:69](../e2e/tests/04-cart-rules.spec.ts#L69) |

### E2E 05 · Control de acceso

| Test                                                                             | Dónde está                                                                           |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `E2E 05 · a visitor is sent to log in before seeing private pages`               | [e2e/tests/05-access-control.spec.ts:6](../e2e/tests/05-access-control.spec.ts#L6)   |
| `E2E 05 · a customer cannot open the admin panel nor the restaurant panel`       | [e2e/tests/05-access-control.spec.ts:19](../e2e/tests/05-access-control.spec.ts#L19) |
| `E2E 05 · an owner cannot open the admin panel`                                  | [e2e/tests/05-access-control.spec.ts:34](../e2e/tests/05-access-control.spec.ts#L34) |
| `E2E 05 · the admin opens the panel that the others cannot`                      | [e2e/tests/05-access-control.spec.ts:46](../e2e/tests/05-access-control.spec.ts#L46) |
| `E2E 05 · the admin sees the orders of every restaurant of the platform`         | [e2e/tests/05-access-control.spec.ts:55](../e2e/tests/05-access-control.spec.ts#L55) |
| `E2E 05 · a customer cannot change the status of an order, even through the API` | [e2e/tests/05-access-control.spec.ts:75](../e2e/tests/05-access-control.spec.ts#L75) |

## Además de la rúbrica

### Pedidos en vivo

Los cambios de los pedidos llegan sin recargar
([ADR-0015](adr/0015-pedidos-en-vivo-con-server-sent-events.md)).

| Test                                                                                                  | Dónde está                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OrderChangePublicationTest#announcesEveryChangeOfStatusOnce`                                         | [backend/…/order/application/OrderChangePublicationTest.java:77](../backend/src/test/java/com/nur/pedidos/order/application/OrderChangePublicationTest.java#L77)               |
| `OrderChangePublicationTest#announcesNothingWhenTheChangeIsNotAllowed`                                | [backend/…/order/application/OrderChangePublicationTest.java:86](../backend/src/test/java/com/nur/pedidos/order/application/OrderChangePublicationTest.java#L86)               |
| `OrderEventsControllerTest#theOwnerHearsOnlyAboutTheOrdersOfTheirRestaurant`                          | [backend/…/order/infrastructure/web/OrderEventsControllerTest.java:99](../backend/src/test/java/com/nur/pedidos/order/infrastructure/web/OrderEventsControllerTest.java#L99)   |
| `OrderEventsControllerTest#theCustomerHearsOnlyAboutTheirOwnOrders`                                   | [backend/…/order/infrastructure/web/OrderEventsControllerTest.java:118](../backend/src/test/java/com/nur/pedidos/order/infrastructure/web/OrderEventsControllerTest.java#L118) |
| `OrderLiveUpdatesTest#theOwnerAndTheCustomerHearAChangeOnlyOnceItIsCommitted`                         | [backend/…/order/OrderLiveUpdatesTest.java:61](../backend/src/test/java/com/nur/pedidos/order/OrderLiveUpdatesTest.java#L61)                                                   |
| `OrderLiveUpdatesTest#nobodyHearsAChangeThatWasRolledBack`                                            | [backend/…/order/OrderLiveUpdatesTest.java:77](../backend/src/test/java/com/nur/pedidos/order/OrderLiveUpdatesTest.java#L77)                                                   |
| `server-events.spec.ts`                                                                               | [frontend/…/core/live/server-events.spec.ts](../frontend/src/app/core/live/server-events.spec.ts)                                                                              |
| `orders-page.spec.ts "shows a new order as it arrives, rings, announces it and counts it in the tab"` | [frontend/…/features/restaurant-admin/pages/orders-page/orders-page.spec.ts:533](../frontend/src/app/features/restaurant-admin/pages/orders-page/orders-page.spec.ts#L533)     |
| `orders-page.spec.ts "warns when the customer cancels a pending order"`                               | [frontend/…/features/restaurant-admin/pages/orders-page/orders-page.spec.ts:593](../frontend/src/app/features/restaurant-admin/pages/orders-page/orders-page.spec.ts#L593)     |
| `order-detail-page.spec.ts "shows the order as soon as the restaurant changes it and announces it"`   | [frontend/…/features/orders/pages/order-detail-page/order-detail-page.spec.ts:464](../frontend/src/app/features/orders/pages/order-detail-page/order-detail-page.spec.ts#L464) |
| `order-detail-page.spec.ts "closes the question to cancel when the restaurant accepts meanwhile"`     | [frontend/…/features/orders/pages/order-detail-page/order-detail-page.spec.ts:505](../frontend/src/app/features/orders/pages/order-detail-page/order-detail-page.spec.ts#L505) |
| `E2E 06 · the restaurant and the customer see each step without reloading`                            | [e2e/tests/06-live-orders.spec.ts:29](../e2e/tests/06-live-orders.spec.ts#L29)                                                                                                 |
| `E2E 06 · the restaurant sees a cancellation without reloading`                                       | [e2e/tests/06-live-orders.spec.ts:62](../e2e/tests/06-live-orders.spec.ts#L62)                                                                                                 |
