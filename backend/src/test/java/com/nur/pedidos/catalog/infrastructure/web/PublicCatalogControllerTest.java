package com.nur.pedidos.catalog.infrastructure.web;

import static com.nur.pedidos.shared.infrastructure.security.TestSessions.sessionOf;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

import com.nur.pedidos.catalog.application.GetVisibleCatalogUseCase;
import com.nur.pedidos.catalog.domain.model.Catalog;
import com.nur.pedidos.catalog.domain.model.Category;
import com.nur.pedidos.catalog.domain.model.Product;
import com.nur.pedidos.restaurant.domain.exception.RestaurantNotFoundException;
import com.nur.pedidos.shared.infrastructure.security.SecurityConfig;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

@WebMvcTest(PublicCatalogController.class)
@Import(SecurityConfig.class)
class PublicCatalogControllerTest {

    private static final String CATALOG = "/api/v1/restaurants/4/catalog";

    @Autowired
    private MockMvcTester mvc;

    @MockitoBean
    private GetVisibleCatalogUseCase getVisibleCatalog;

    @Test
    void returnsTheCatalogOfARestaurantWithoutSession() {
        Category mainDishes = new Category(3L, 4L, "Platos fuertes");
        when(getVisibleCatalog.execute(4L))
                .thenReturn(new Catalog(
                        List.of(mainDishes),
                        List.of(
                                new Product(
                                        10L,
                                        4L,
                                        3L,
                                        "Silpancho",
                                        "Con arroz y huevo",
                                        new BigDecimal("45.00"),
                                        true,
                                        null),
                                new Product(11L, 4L, 3L, "Pique macho", null, new BigDecimal("60.50"), false, null))));

        var response = mvc.get().uri(CATALOG);

        assertThat(response).hasStatus(HttpStatus.OK).bodyJson().isStrictlyEqualTo("""
                {
                  "categories": [
                    {
                      "id": 3,
                      "name": "Platos fuertes",
                      "products": [
                        {
                          "id": 10,
                          "categoryId": 3,
                          "name": "Silpancho",
                          "description": "Con arroz y huevo",
                          "price": 45.00,
                          "available": true,
                          "imageUrl": null
                        },
                        {
                          "id": 11,
                          "categoryId": 3,
                          "name": "Pique macho",
                          "description": null,
                          "price": 60.50,
                          "available": false,
                          "imageUrl": null
                        }
                      ]
                    }
                  ]
                }
                """);
        assertThat(response).bodyText().contains("\"price\":45.00", "\"price\":60.50");
    }

    @ParameterizedTest
    @ValueSource(strings = {"CUSTOMER", "OWNER", "ADMIN"})
    void returnsTheCatalogForEveryRole(String role) {
        when(getVisibleCatalog.execute(4L)).thenReturn(new Catalog(List.of(), List.of()));

        assertThat(mvc.get().uri(CATALOG).with(sessionOf(role, 3L)))
                .hasStatus(HttpStatus.OK)
                .bodyJson()
                .isStrictlyEqualTo("""
                        {"categories": []}
                        """);
    }

    @Test
    void returnsANeutralNotFoundForAHiddenOrMissingRestaurant() {
        when(getVisibleCatalog.execute(4L)).thenThrow(new RestaurantNotFoundException());

        assertThat(mvc.get().uri(CATALOG))
                .hasStatus(HttpStatus.NOT_FOUND)
                .bodyJson()
                .satisfies(json -> {
                    assertThat(json).extractingPath("$.code").isEqualTo("restaurant.not_found");
                    assertThat(json).extractingPath("$.detail").isEqualTo("No encontramos el restaurante");
                });
    }

    @Test
    void rejectsAnIdThatIsNotANumber() {
        assertThat(mvc.get().uri("/api/v1/restaurants/abc/catalog"))
                .hasStatus(HttpStatus.BAD_REQUEST)
                .bodyJson()
                .satisfies(json -> {
                    assertThat(json).extractingPath("$.code").isEqualTo("validation_failed");
                    assertThat(json).extractingPath("$.errors[0].field").isEqualTo("restaurantId");
                });
        verifyNoInteractions(getVisibleCatalog);
    }

    @ParameterizedTest
    @ValueSource(strings = {"POST", "PUT", "PATCH", "DELETE"})
    void opensTheCatalogOnlyForReading(String method) {
        assertThat(mvc.method(HttpMethod.valueOf(method)).uri(CATALOG).with(csrf()))
                .hasStatus(HttpStatus.UNAUTHORIZED)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("unauthenticated");
        verifyNoInteractions(getVisibleCatalog);
    }

    @Test
    void keepsTheCatalogOfTheOwnerBehindTheSession() {
        assertThat(mvc.get().uri("/api/v1/restaurants/mine/catalog"))
                .hasStatus(HttpStatus.UNAUTHORIZED)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("unauthenticated");
        verifyNoInteractions(getVisibleCatalog);
    }
}
