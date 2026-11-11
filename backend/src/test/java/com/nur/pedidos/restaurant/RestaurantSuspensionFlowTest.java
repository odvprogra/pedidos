package com.nur.pedidos.restaurant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;

import com.nur.pedidos.TestcontainersConfiguration;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureRestTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.client.RestTestClient;

@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = {"ADMIN_EMAIL=admin@pedidos.com", "ADMIN_PASSWORD=admin-secreta"})
@AutoConfigureRestTestClient
@Import(TestcontainersConfiguration.class)
class RestaurantSuspensionFlowTest {

    private static final String MINE = "/api/v1/restaurants/mine";

    @Autowired
    private RestTestClient client;

    @Test
    void aSuspendedRestaurantDisappearsForCustomersAndStopsTakingOrders() {
        Menu menu = openRestaurantWithMenu("rosa@suspension.com");
        Account customer = register("ana@suspension.com", "CUSTOMER");

        expectRestaurant(admin().act(restaurant(menu, "suspend")), false, true);

        assertThat(visibleRestaurantIds()).doesNotContain(menu.restaurantId());
        expectNotFound(customer.get("/api/v1/restaurants/" + menu.restaurantId()));
        expectNotFound(customer.get("/api/v1/restaurants/" + menu.restaurantId() + "/catalog"));
        customer.post("/api/v1/orders", silpanchoFrom(menu))
                .expectStatus()
                .isEqualTo(HttpStatus.UNPROCESSABLE_CONTENT)
                .expectBody()
                .jsonPath("$.code")
                .isEqualTo("order.restaurant_unavailable");
    }

    @Test
    void theOwnerOfASuspendedRestaurantCannotOpenItButFinishesTheOrdersInProgress() {
        Menu menu = openRestaurantWithMenu("luis@suspension.com");
        Account customer = register("carla@suspension.com", "CUSTOMER");
        Long accepted = place(customer, menu);
        Long pending = place(customer, menu);
        expectStatus(menu.owner().act(MINE + "/orders/" + accepted + "/accept"), "ACCEPTED");

        admin().act(restaurant(menu, "suspend")).expectStatus().isOk();

        expectRestaurant(menu.owner().get(MINE), false, true);
        menu.owner()
                .act(MINE + "/open")
                .expectStatus()
                .isEqualTo(HttpStatus.CONFLICT)
                .expectBody()
                .jsonPath("$.code")
                .isEqualTo("restaurant.suspended");
        expectStatus(menu.owner().act(MINE + "/orders/" + accepted + "/start-preparing"), "IN_PREPARATION");
        expectStatus(menu.owner().act(MINE + "/orders/" + accepted + "/mark-ready"), "READY");
        expectStatus(menu.owner().act(MINE + "/orders/" + accepted + "/mark-picked-up"), "PICKED_UP");
        expectStatus(menu.owner().act(MINE + "/orders/" + pending + "/accept"), "ACCEPTED");
    }

    @Test
    void aCustomerStillFollowsAndCancelsTheirPendingOrderOnceTheRestaurantIsSuspended() {
        Menu menu = openRestaurantWithMenu("eva@suspension.com");
        Account customer = register("pablo@suspension.com", "CUSTOMER");
        Long orderId = place(customer, menu);

        admin().act(restaurant(menu, "suspend")).expectStatus().isOk();

        expectStatus(customer.get("/api/v1/orders/" + orderId), "PLACED");
        expectStatus(customer.act("/api/v1/orders/" + orderId + "/cancel"), "CANCELLED");
    }

    @Test
    void aReactivatedRestaurantComesBackClosedUntilItsOwnerOpensIt() {
        Menu menu = openRestaurantWithMenu("marta@suspension.com");
        Account customer = register("sofia@suspension.com", "CUSTOMER");
        Account admin = admin();
        admin.act(restaurant(menu, "suspend")).expectStatus().isOk();

        expectRestaurant(admin.act(restaurant(menu, "reactivate")), false, false);

        assertThat(visibleRestaurantIds()).contains(menu.restaurantId());
        customer.get("/api/v1/restaurants/" + menu.restaurantId())
                .expectStatus()
                .isOk()
                .expectBody()
                .jsonPath("$.open")
                .isEqualTo(false);
        customer.post("/api/v1/orders", silpanchoFrom(menu))
                .expectStatus()
                .isEqualTo(HttpStatus.UNPROCESSABLE_CONTENT)
                .expectBody()
                .jsonPath("$.code")
                .isEqualTo("order.restaurant_unavailable");
        menu.owner().act(MINE + "/open").expectStatus().isNoContent();
        customer.post("/api/v1/orders", silpanchoFrom(menu)).expectStatus().isCreated();
    }

    @Test
    void theAdminSeesEveryRestaurantWithItsStateIncludingTheSuspendedOnes() {
        Menu suspended = openRestaurantWithMenu("hugo@suspension.com");
        Menu active = openRestaurantWithMenu("gina@suspension.com");
        Account admin = admin();
        admin.act(restaurant(suspended, "suspend")).expectStatus().isOk();

        List<RestaurantView> listed = admin.get("/api/v1/admin/restaurants?size=100")
                .expectStatus()
                .isOk()
                .expectBody(RestaurantPage.class)
                .returnResult()
                .getResponseBody()
                .items();

        assertThat(listed)
                .filteredOn(view ->
                        List.of(suspended.restaurantId(), active.restaurantId()).contains(view.id()))
                .extracting(RestaurantView::id, RestaurantView::open, RestaurantView::suspended)
                .containsExactly(
                        tuple(suspended.restaurantId(), false, true), tuple(active.restaurantId(), true, false));
    }

    private static String restaurant(Menu menu, String action) {
        return "/api/v1/restaurants/" + menu.restaurantId() + "/" + action;
    }

    private static void expectRestaurant(RestTestClient.ResponseSpec response, boolean open, boolean suspended) {
        response.expectStatus()
                .isOk()
                .expectBody()
                .jsonPath("$.open")
                .isEqualTo(open)
                .jsonPath("$.suspended")
                .isEqualTo(suspended);
    }

    private static void expectNotFound(RestTestClient.ResponseSpec response) {
        response.expectStatus().isNotFound().expectBody().jsonPath("$.code").isEqualTo("restaurant.not_found");
    }

    private static void expectStatus(RestTestClient.ResponseSpec response, String status) {
        response.expectStatus().isOk().expectBody().jsonPath("$.status").isEqualTo(status);
    }

    private List<Long> visibleRestaurantIds() {
        return client
                .get()
                .uri("/api/v1/restaurants?size=100")
                .exchange()
                .expectStatus()
                .isOk()
                .expectBody(IdPage.class)
                .returnResult()
                .getResponseBody()
                .items()
                .stream()
                .map(IdView::id)
                .toList();
    }

    private Long place(Account customer, Menu menu) {
        return customer.post("/api/v1/orders", silpanchoFrom(menu))
                .expectStatus()
                .isCreated()
                .expectBody(IdView.class)
                .returnResult()
                .getResponseBody()
                .id();
    }

    private static OrderBody silpanchoFrom(Menu menu) {
        return new OrderBody(menu.restaurantId(), List.of(new LineBody(menu.silpancho(), 1)));
    }

    private Menu openRestaurantWithMenu(String ownerEmail) {
        Account owner = register(ownerEmail, "OWNER");
        Long restaurantId = owner.post("/api/v1/restaurants", new RestaurantBody("La Casona", "Calle Sucre 245"))
                .expectStatus()
                .isCreated()
                .expectBody(IdView.class)
                .returnResult()
                .getResponseBody()
                .id();
        Long category = owner.post(MINE + "/categories", new CategoryBody("Platos fuertes"))
                .expectBody(IdView.class)
                .returnResult()
                .getResponseBody()
                .id();
        Long silpancho = owner.post(
                        MINE + "/products", new ProductBody(category, "Silpancho", null, new BigDecimal("45")))
                .expectStatus()
                .isCreated()
                .expectBody(IdView.class)
                .returnResult()
                .getResponseBody()
                .id();
        owner.act(MINE + "/open").expectStatus().isNoContent();
        return new Menu(owner, restaurantId, silpancho);
    }

    private Account admin() {
        String csrfToken = csrfToken();
        String session = client.post()
                .uri("/api/v1/auth/login")
                .cookie("XSRF-TOKEN", csrfToken)
                .header("X-XSRF-TOKEN", csrfToken)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new CredentialsBody("admin@pedidos.com", "admin-secreta"))
                .exchange()
                .expectStatus()
                .isOk()
                .returnResult()
                .getResponseCookies()
                .getFirst("SESSION")
                .getValue();
        return new Account(client, session, csrfToken);
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

    private record Menu(Account owner, Long restaurantId, Long silpancho) {}

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

    private record CredentialsBody(String email, String password) {}

    private record RestaurantBody(String name, String address) {}

    private record CategoryBody(String name) {}

    private record ProductBody(Long categoryId, String name, String description, BigDecimal price) {}

    private record IdView(Long id) {}

    private record OrderBody(Long restaurantId, List<LineBody> items) {}

    private record LineBody(Long productId, int quantity) {}

    private record RestaurantView(Long id, boolean open, boolean suspended) {}

    private record RestaurantPage(List<RestaurantView> items) {}

    private record IdPage(List<IdView> items) {}
}
