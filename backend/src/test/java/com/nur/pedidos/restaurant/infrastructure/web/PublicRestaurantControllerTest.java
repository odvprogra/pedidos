package com.nur.pedidos.restaurant.infrastructure.web;

import static com.nur.pedidos.shared.infrastructure.security.TestSessions.sessionOf;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.nur.pedidos.restaurant.application.GetVisibleRestaurantUseCase;
import com.nur.pedidos.restaurant.application.ListVisibleRestaurantsUseCase;
import com.nur.pedidos.restaurant.domain.exception.RestaurantNotFoundException;
import com.nur.pedidos.restaurant.domain.model.Restaurant;
import com.nur.pedidos.shared.domain.model.PageResult;
import com.nur.pedidos.shared.infrastructure.security.SecurityConfig;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

@WebMvcTest(PublicRestaurantController.class)
@Import(SecurityConfig.class)
class PublicRestaurantControllerTest {

    private static final Instant NOW = Instant.parse("2026-11-08T15:00:00Z");

    @Autowired
    private MockMvcTester mvc;

    @MockitoBean
    private ListVisibleRestaurantsUseCase listVisibleRestaurants;

    @MockitoBean
    private GetVisibleRestaurantUseCase getVisibleRestaurant;

    @Test
    void listsTheFirstPageOfRestaurantsWithoutSession() {
        when(listVisibleRestaurants.execute(0, 20))
                .thenReturn(new PageResult<>(
                        List.of(
                                restaurant(4L, "El Fogón", "Parrilla al carbón", true),
                                restaurant(1L, "La Casona", null, false)),
                        0,
                        20,
                        2));

        assertThat(mvc.get().uri("/api/v1/restaurants"))
                .hasStatus(HttpStatus.OK)
                .bodyJson()
                .isStrictlyEqualTo("""
                        {
                          "items": [
                            {
                              "id": 4,
                              "name": "El Fogón",
                              "description": "Parrilla al carbón",
                              "address": "Calle Sucre 245",
                              "open": true
                            },
                            {
                              "id": 1,
                              "name": "La Casona",
                              "description": null,
                              "address": "Calle Sucre 245",
                              "open": false
                            }
                          ],
                          "page": 0,
                          "size": 20,
                          "totalItems": 2,
                          "totalPages": 1
                        }
                        """);
    }

    @ParameterizedTest
    @ValueSource(strings = {"CUSTOMER", "OWNER", "ADMIN"})
    void listsTheRestaurantsForEveryRole(String role) {
        when(listVisibleRestaurants.execute(0, 20)).thenReturn(new PageResult<>(List.of(), 0, 20, 0));

        assertThat(mvc.get().uri("/api/v1/restaurants").with(sessionOf(role, 3L)))
                .hasStatus(HttpStatus.OK)
                .bodyJson()
                .extractingPath("$.totalItems")
                .isEqualTo(0);
    }

    @ParameterizedTest
    @CsvSource({"0, 1", "2, 20", "1000000, 100"})
    void listsTheRequestedPageAndSize(int page, int size) {
        when(listVisibleRestaurants.execute(page, size)).thenReturn(new PageResult<>(List.of(), page, size, 45));

        var response = mvc.get().uri("/api/v1/restaurants?page=" + page + "&size=" + size);

        assertThat(response).hasStatus(HttpStatus.OK).bodyJson().satisfies(json -> {
            assertThat(json).extractingPath("$.page").isEqualTo(page);
            assertThat(json).extractingPath("$.size").isEqualTo(size);
            assertThat(json).extractingPath("$.totalItems").isEqualTo(45);
        });
        verify(listVisibleRestaurants).execute(page, size);
    }

    @ParameterizedTest
    @CsvSource({
        "page=-1, page",
        "page=1000001, page",
        "page=abc, page",
        "size=0, size",
        "size=101, size",
        "size=abc, size"
    })
    void rejectsAnInvalidPageOrSize(String query, String field) {
        assertThat(mvc.get().uri("/api/v1/restaurants?" + query))
                .hasStatus(HttpStatus.BAD_REQUEST)
                .bodyJson()
                .satisfies(json -> {
                    assertThat(json).extractingPath("$.code").isEqualTo("validation_failed");
                    assertThat(json).extractingPath("$.errors[0].field").isEqualTo(field);
                });
        verifyNoInteractions(listVisibleRestaurants);
    }

    @Test
    void returnsAVisibleRestaurantWithoutSession() {
        when(getVisibleRestaurant.execute(4L)).thenReturn(restaurant(4L, "El Fogón", "Parrilla al carbón", false));

        assertThat(mvc.get().uri("/api/v1/restaurants/4"))
                .hasStatus(HttpStatus.OK)
                .bodyJson()
                .isStrictlyEqualTo("""
                        {
                          "id": 4,
                          "name": "El Fogón",
                          "description": "Parrilla al carbón",
                          "address": "Calle Sucre 245",
                          "open": false
                        }
                        """);
    }

    @ParameterizedTest
    @ValueSource(strings = {"CUSTOMER", "OWNER", "ADMIN"})
    void returnsARestaurantForEveryRole(String role) {
        when(getVisibleRestaurant.execute(4L)).thenReturn(restaurant(4L, "El Fogón", null, true));

        assertThat(mvc.get().uri("/api/v1/restaurants/4").with(sessionOf(role, 3L)))
                .hasStatus(HttpStatus.OK)
                .bodyJson()
                .extractingPath("$.name")
                .isEqualTo("El Fogón");
    }

    @Test
    void returnsANeutralNotFoundForAHiddenOrMissingRestaurant() {
        when(getVisibleRestaurant.execute(4L)).thenThrow(new RestaurantNotFoundException());

        assertThat(mvc.get().uri("/api/v1/restaurants/4"))
                .hasStatus(HttpStatus.NOT_FOUND)
                .bodyJson()
                .satisfies(json -> {
                    assertThat(json).extractingPath("$.code").isEqualTo("restaurant.not_found");
                    assertThat(json).extractingPath("$.detail").isEqualTo("No encontramos el restaurante");
                });
    }

    @Test
    void rejectsAnIdThatIsNotANumber() {
        assertThat(mvc.get().uri("/api/v1/restaurants/abc"))
                .hasStatus(HttpStatus.BAD_REQUEST)
                .bodyJson()
                .satisfies(json -> {
                    assertThat(json).extractingPath("$.code").isEqualTo("validation_failed");
                    assertThat(json).extractingPath("$.errors[0].field").isEqualTo("id");
                });
        verifyNoInteractions(getVisibleRestaurant);
    }

    @Test
    void keepsTheRestaurantOfTheOwnerBehindTheSession() {
        assertThat(mvc.get().uri("/api/v1/restaurants/mine"))
                .hasStatus(HttpStatus.UNAUTHORIZED)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("unauthenticated");
        verifyNoInteractions(getVisibleRestaurant);
    }

    private static Restaurant restaurant(Long id, String name, String description, boolean open) {
        return new Restaurant(id, 7L, name, description, "Calle Sucre 245", open, false, NOW);
    }
}
