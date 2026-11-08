package com.nur.pedidos.order;

import static org.assertj.core.api.Assertions.assertThat;

import com.nur.pedidos.TestcontainersConfiguration;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureRestTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.client.RestTestClient;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureRestTestClient
@Import(TestcontainersConfiguration.class)
class OrderFlowTest {

    @Autowired
    private RestTestClient client;

    @Test
    void aCustomerOrdersFromTheMenuOfAnOpenRestaurant() {
        Menu menu = openRestaurantWithMenu("rosa@pedido.com");
        Account customer = register("ana@pedido.com", "CUSTOMER");

        var result = customer.post(
                        "/api/v1/orders",
                        new OrderBody(
                                menu.restaurantId(),
                                List.of(new LineBody(menu.silpancho(), 2), new LineBody(menu.lemonade(), 3))))
                .expectStatus()
                .isCreated()
                .expectBody(OrderView.class)
                .returnResult();

        OrderView order = result.getResponseBody();
        assertThat(result.getResponseHeaders().getLocation()).hasToString("/api/v1/orders/" + order.id());
        assertThat(order)
                .extracting(OrderView::restaurantId, OrderView::restaurantName, OrderView::status, OrderView::total)
                .containsExactly(menu.restaurantId(), "La Casona", "PLACED", new BigDecimal("121.50"));
        assertThat(order.placedAt()).isNotNull();
        assertThat(order.items())
                .containsExactly(
                        new ItemView(
                                menu.silpancho(), "Silpancho", new BigDecimal("45.00"), 2, new BigDecimal("90.00")),
                        new ItemView(menu.lemonade(), "Limonada", new BigDecimal("10.50"), 3, new BigDecimal("31.50")));
    }

    @Test
    void aCustomerCannotOrderFromAClosedRestaurantNorASoldOutProduct() {
        Menu menu = openRestaurantWithMenu("luis@pedido.com");
        Account customer = register("carla@pedido.com", "CUSTOMER");
        OrderBody silpanchos = new OrderBody(menu.restaurantId(), List.of(new LineBody(menu.silpancho(), 1)));

        menu.owner().act("/api/v1/restaurants/mine/close").expectStatus().isNoContent();
        customer.post("/api/v1/orders", silpanchos)
                .expectStatus()
                .isEqualTo(HttpStatus.UNPROCESSABLE_CONTENT)
                .expectBody()
                .jsonPath("$.code")
                .isEqualTo("order.restaurant_unavailable");

        menu.owner().act("/api/v1/restaurants/mine/open").expectStatus().isNoContent();
        menu.owner()
                .act("/api/v1/restaurants/mine/products/" + menu.silpancho() + "/mark-sold-out")
                .expectStatus()
                .isNoContent();
        customer.post("/api/v1/orders", silpanchos)
                .expectStatus()
                .isEqualTo(HttpStatus.UNPROCESSABLE_CONTENT)
                .expectBody()
                .jsonPath("$.code")
                .isEqualTo("order.product_unavailable");
    }

    @Test
    void aCustomerIsToldThatAnUnknownRestaurantIsNotTakingOrders() {
        Account customer = register("diego@pedido.com", "CUSTOMER");

        customer.post("/api/v1/orders", new OrderBody(999_999L, List.of(new LineBody(1L, 1))))
                .expectStatus()
                .isEqualTo(HttpStatus.UNPROCESSABLE_CONTENT)
                .expectBody()
                .jsonPath("$.code")
                .isEqualTo("order.restaurant_unavailable");
    }

    @Test
    void onlyACustomerWithSessionPlacesOrders() {
        Menu menu = openRestaurantWithMenu("eva@pedido.com");
        OrderBody silpancho = new OrderBody(menu.restaurantId(), List.of(new LineBody(menu.silpancho(), 1)));

        menu.owner()
                .post("/api/v1/orders", silpancho)
                .expectStatus()
                .isForbidden()
                .expectBody()
                .jsonPath("$.code")
                .isEqualTo("access_denied");
        String csrfToken = csrfToken();
        client.post()
                .uri("/api/v1/orders")
                .cookie("XSRF-TOKEN", csrfToken)
                .header("X-XSRF-TOKEN", csrfToken)
                .contentType(MediaType.APPLICATION_JSON)
                .body(silpancho)
                .exchange()
                .expectStatus()
                .isUnauthorized()
                .expectBody()
                .jsonPath("$.code")
                .isEqualTo("unauthenticated");
    }

    private Menu openRestaurantWithMenu(String ownerEmail) {
        Account owner = register(ownerEmail, "OWNER");
        owner.post("/api/v1/restaurants", new RestaurantBody("La Casona", "Calle Sucre 245"))
                .expectStatus()
                .isCreated();
        Long restaurantId = owner.get("/api/v1/restaurants/mine")
                .expectBody(IdView.class)
                .returnResult()
                .getResponseBody()
                .id();
        Long mainDishes = owner.post("/api/v1/restaurants/mine/categories", new CategoryBody("Platos fuertes"))
                .expectBody(IdView.class)
                .returnResult()
                .getResponseBody()
                .id();
        Long silpancho = createProduct(owner, mainDishes, "Silpancho", "45");
        Long lemonade = createProduct(owner, mainDishes, "Limonada", "10.5");
        owner.act("/api/v1/restaurants/mine/open").expectStatus().isNoContent();
        return new Menu(owner, restaurantId, silpancho, lemonade);
    }

    private Long createProduct(Account owner, Long categoryId, String name, String price) {
        return owner.post(
                        "/api/v1/restaurants/mine/products",
                        new ProductBody(categoryId, name, null, new BigDecimal(price)))
                .expectStatus()
                .isCreated()
                .expectBody(IdView.class)
                .returnResult()
                .getResponseBody()
                .id();
    }

    private Account register(String email, String role) {
        String csrfToken = csrfToken();
        String session = client.post()
                .uri("/api/v1/auth/register")
                .cookie("XSRF-TOKEN", csrfToken)
                .header("X-XSRF-TOKEN", csrfToken)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new RegistrationBody("Rosa Mamani", email, "secreta123", role))
                .exchange()
                .expectStatus()
                .isCreated()
                .returnResult()
                .getResponseCookies()
                .getFirst("SESSION")
                .getValue();
        return new Account(client, session, csrfToken);
    }

    private String csrfToken() {
        return client.get()
                .uri("/api/health")
                .exchange()
                .returnResult()
                .getResponseCookies()
                .getFirst("XSRF-TOKEN")
                .getValue();
    }

    private record Menu(Account owner, Long restaurantId, Long silpancho, Long lemonade) {}

    private record Account(RestTestClient client, String session, String csrfToken) {

        RestTestClient.ResponseSpec get(String uri) {
            return client.get().uri(uri).cookie("SESSION", session).exchange();
        }

        RestTestClient.ResponseSpec post(String uri, Object body) {
            return client.post()
                    .uri(uri)
                    .cookie("SESSION", session)
                    .cookie("XSRF-TOKEN", csrfToken)
                    .header("X-XSRF-TOKEN", csrfToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .exchange();
        }

        RestTestClient.ResponseSpec act(String uri) {
            return client.post()
                    .uri(uri)
                    .cookie("SESSION", session)
                    .cookie("XSRF-TOKEN", csrfToken)
                    .header("X-XSRF-TOKEN", csrfToken)
                    .exchange();
        }
    }

    private record RegistrationBody(String name, String email, String password, String role) {}

    private record RestaurantBody(String name, String address) {}

    private record CategoryBody(String name) {}

    private record ProductBody(Long categoryId, String name, String description, BigDecimal price) {}

    private record IdView(Long id) {}

    private record OrderBody(Long restaurantId, List<LineBody> items) {}

    private record LineBody(Long productId, int quantity) {}

    private record ItemView(
            Long productId, String productName, BigDecimal unitPrice, int quantity, BigDecimal subtotal) {}

    private record OrderView(
            Long id,
            Long restaurantId,
            String restaurantName,
            String status,
            BigDecimal total,
            Instant placedAt,
            List<ItemView> items) {}
}
