package com.nur.pedidos.catalog.infrastructure.web;

import static com.nur.pedidos.shared.infrastructure.security.TestSessions.sessionOf;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.nur.pedidos.catalog.application.GetOwnCatalogUseCase;
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
import org.springframework.http.HttpStatus;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

@WebMvcTest(CatalogController.class)
@Import(SecurityConfig.class)
class CatalogControllerTest {

    private static final String CATALOG = "/api/v1/restaurants/mine/catalog";

    @Autowired
    private MockMvcTester mvc;

    @MockitoBean
    private GetOwnCatalogUseCase getOwnCatalog;

    @Test
    void returnsTheCategoriesOfTheOwnerWithTheirProducts() {
        Category mainDishes = new Category(3L, 4L, "Platos fuertes");
        Category drinks = new Category(5L, 4L, "Bebidas");
        when(getOwnCatalog.execute(7L))
                .thenReturn(new Catalog(
                        List.of(mainDishes, drinks),
                        List.of(
                                new Product(
                                        10L, 4L, 3L, "Silpancho", "Con arroz y huevo", new BigDecimal("45.00"), true),
                                new Product(11L, 4L, 3L, "Pique macho", null, new BigDecimal("60.50"), false))));

        var response = mvc.get().uri(CATALOG).with(sessionOf("OWNER", 7L));

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
                          "available": true
                        },
                        {
                          "id": 11,
                          "categoryId": 3,
                          "name": "Pique macho",
                          "description": null,
                          "price": 60.50,
                          "available": false
                        }
                      ]
                    },
                    { "id": 5, "name": "Bebidas", "products": [] }
                  ]
                }
                """);
        assertThat(response).bodyText().contains("\"price\":45.00", "\"price\":60.50");
    }

    @Test
    void returnsAnEmptyListWhenTheRestaurantHasNoCategories() {
        when(getOwnCatalog.execute(7L)).thenReturn(new Catalog(List.of(), List.of()));

        assertThat(mvc.get().uri(CATALOG).with(sessionOf("OWNER", 7L)))
                .hasStatus(HttpStatus.OK)
                .bodyJson()
                .isStrictlyEqualTo("""
                        {"categories": []}
                        """);
    }

    @Test
    void returnsNotFoundWhenTheOwnerHasNoRestaurant() {
        when(getOwnCatalog.execute(7L)).thenThrow(new RestaurantNotFoundException());

        assertThat(mvc.get().uri(CATALOG).with(sessionOf("OWNER", 7L)))
                .hasStatus(HttpStatus.NOT_FOUND)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("restaurant.not_found");
    }

    @Test
    void rejectsReadingTheCatalogWithoutSession() {
        assertThat(mvc.get().uri(CATALOG))
                .hasStatus(HttpStatus.UNAUTHORIZED)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("unauthenticated");
        verifyNoInteractions(getOwnCatalog);
    }

    @ParameterizedTest
    @ValueSource(strings = {"CUSTOMER", "ADMIN"})
    void rejectsReadingTheCatalogFromAnotherRole(String role) {
        assertThat(mvc.get().uri(CATALOG).with(sessionOf(role, 3L)))
                .hasStatus(HttpStatus.FORBIDDEN)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("access_denied");
        verifyNoInteractions(getOwnCatalog);
    }
}
