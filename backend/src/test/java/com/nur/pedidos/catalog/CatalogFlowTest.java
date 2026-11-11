package com.nur.pedidos.catalog;

import static org.assertj.core.api.Assertions.assertThat;

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

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureRestTestClient
@Import(TestcontainersConfiguration.class)
class CatalogFlowTest {

    @Autowired
    private RestTestClient client;

    @Test
    void anOwnerBuildsTheMenuOfTheirRestaurant() {
        Owner owner = ownerWithRestaurant("rosa@catalogo.com");

        Long mainDishes = owner.post("/api/v1/restaurants/mine/categories", new CategoryBody("Platos fuertes"))
                .expectStatus()
                .isCreated()
                .expectBody(CategoryView.class)
                .returnResult()
                .getResponseBody()
                .id();
        owner.post("/api/v1/restaurants/mine/categories", new CategoryBody(" PLATOS FUERTES "))
                .expectStatus()
                .isEqualTo(HttpStatus.CONFLICT);
        Long silpancho = owner.post(
                        "/api/v1/restaurants/mine/products",
                        new ProductBody(mainDishes, "Silpancho", "Con arroz y huevo", new BigDecimal("45")))
                .expectStatus()
                .isCreated()
                .expectBody(ProductView.class)
                .returnResult()
                .getResponseBody()
                .id();
        owner.act("/api/v1/restaurants/mine/products/" + silpancho + "/mark-sold-out")
                .expectStatus()
                .isNoContent();

        owner.delete("/api/v1/restaurants/mine/categories/" + mainDishes)
                .expectStatus()
                .isEqualTo(HttpStatus.CONFLICT);
        owner.get("/api/v1/restaurants/mine/catalog")
                .expectStatus()
                .isOk()
                .expectBody(CatalogView.class)
                .isEqualTo(new CatalogView(List.of(new SectionView(
                        mainDishes,
                        "Platos fuertes",
                        List.of(new ProductView(
                                silpancho,
                                mainDishes,
                                "Silpancho",
                                "Con arroz y huevo",
                                new BigDecimal("45.00"),
                                false))))));
    }

    @Test
    void anOwnerCannotTouchTheMenuOfAnotherRestaurant() {
        Owner rosa = ownerWithRestaurant("rosa@otro.com");
        Owner luis = ownerWithRestaurant("luis@otro.com");
        Long drinks = rosa.post("/api/v1/restaurants/mine/categories", new CategoryBody("Bebidas"))
                .expectStatus()
                .isCreated()
                .expectBody(CategoryView.class)
                .returnResult()
                .getResponseBody()
                .id();

        luis.delete("/api/v1/restaurants/mine/categories/" + drinks)
                .expectStatus()
                .isForbidden()
                .expectBody()
                .jsonPath("$.code")
                .isEqualTo("catalog.not_owner");
        luis.get("/api/v1/restaurants/mine/catalog")
                .expectStatus()
                .isOk()
                .expectBody()
                .json("""
                        {"categories": []}
                        """);
    }

    @Test
    void anOwnerWithoutRestaurantIsToldToRegisterItFirst() {
        Owner owner = owner("sin@restaurante.com");

        owner.get("/api/v1/restaurants/mine/catalog")
                .expectStatus()
                .isNotFound()
                .expectBody()
                .jsonPath("$.code")
                .isEqualTo("restaurant.not_found");
        owner.post("/api/v1/restaurants/mine/categories", new CategoryBody("Bebidas"))
                .expectStatus()
                .isNotFound();
    }

    @Test
    void aVisitorWithoutSessionBrowsesARestaurantAndItsMenu() {
        Owner owner = ownerWithRestaurant("ana@visita.com");
        Long restaurant = owner.get("/api/v1/restaurants/mine")
                .expectStatus()
                .isOk()
                .expectBody(RestaurantView.class)
                .returnResult()
                .getResponseBody()
                .id();
        Long mainDishes = owner.post("/api/v1/restaurants/mine/categories", new CategoryBody("Platos fuertes"))
                .expectBody(CategoryView.class)
                .returnResult()
                .getResponseBody()
                .id();
        owner.post("/api/v1/restaurants/mine/categories", new CategoryBody("Bebidas"))
                .expectStatus()
                .isCreated();
        Long silpancho = owner.post(
                        "/api/v1/restaurants/mine/products",
                        new ProductBody(mainDishes, "Silpancho", null, new BigDecimal("45")))
                .expectBody(ProductView.class)
                .returnResult()
                .getResponseBody()
                .id();
        owner.act("/api/v1/restaurants/mine/products/" + silpancho + "/mark-sold-out")
                .expectStatus()
                .isNoContent();

        client.get()
                .uri("/api/v1/restaurants/" + restaurant)
                .exchange()
                .expectStatus()
                .isOk()
                .expectBody(RestaurantView.class)
                .isEqualTo(new RestaurantView(restaurant, "La Casona", null, "Calle Sucre 245", false));
        client.get()
                .uri("/api/v1/restaurants/" + restaurant + "/catalog")
                .exchange()
                .expectStatus()
                .isOk()
                .expectBody(CatalogView.class)
                .isEqualTo(new CatalogView(List.of(new SectionView(
                        mainDishes,
                        "Platos fuertes",
                        List.of(new ProductView(
                                silpancho, mainDishes, "Silpancho", null, new BigDecimal("45.00"), false))))));

        owner.act("/api/v1/restaurants/mine/open").expectStatus().isNoContent();

        RestaurantPage page = client.get()
                .uri("/api/v1/restaurants?size=100")
                .exchange()
                .expectStatus()
                .isOk()
                .expectBody(RestaurantPage.class)
                .returnResult()
                .getResponseBody();
        assertThat(page.items())
                .filteredOn(item -> item.id().equals(restaurant))
                .extracting(RestaurantView::open)
                .containsExactly(true);
        client.get().uri("/api/v1/restaurants/mine").exchange().expectStatus().isUnauthorized();
        client.get()
                .uri("/api/v1/restaurants/mine/catalog")
                .exchange()
                .expectStatus()
                .isUnauthorized();
    }

    @Test
    void aVisitorIsToldThatAnUnknownRestaurantDoesNotExist() {
        client.get()
                .uri("/api/v1/restaurants/999999/catalog")
                .exchange()
                .expectStatus()
                .isNotFound()
                .expectBody()
                .jsonPath("$.code")
                .isEqualTo("restaurant.not_found");
    }

    private Owner ownerWithRestaurant(String email) {
        Owner owner = owner(email);
        owner.post("/api/v1/restaurants", new RestaurantBody("La Casona", "Calle Sucre 245"))
                .expectStatus()
                .isCreated();
        return owner;
    }

    private Owner owner(String email) {
        String csrfToken = client.get()
                .uri("/api/health")
                .exchange()
                .returnResult()
                .getResponseCookies()
                .getFirst("XSRF-TOKEN")
                .getValue();
        String session = client.post()
                .uri("/api/v1/auth/register")
                .cookie("XSRF-TOKEN", csrfToken)
                .header("X-XSRF-TOKEN", csrfToken)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new RegistrationBody("Rosa Mamani", email, "secreta123", "OWNER"))
                .exchange()
                .expectStatus()
                .isCreated()
                .returnResult()
                .getResponseCookies()
                .getFirst("SESSION")
                .getValue();
        return new Owner(client, session, csrfToken);
    }

    private record Owner(RestTestClient client, String session, String csrfToken) {

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

        RestTestClient.ResponseSpec delete(String uri) {
            return client.delete()
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

    private record CategoryView(Long id, String name) {}

    private record ProductBody(Long categoryId, String name, String description, BigDecimal price) {}

    private record ProductView(
            Long id, Long categoryId, String name, String description, BigDecimal price, boolean available) {}

    private record SectionView(Long id, String name, List<ProductView> products) {}

    private record CatalogView(List<SectionView> categories) {}

    private record RestaurantView(Long id, String name, String description, String address, boolean open) {}

    private record RestaurantPage(List<RestaurantView> items, int page, int size, long totalItems, int totalPages) {}
}
