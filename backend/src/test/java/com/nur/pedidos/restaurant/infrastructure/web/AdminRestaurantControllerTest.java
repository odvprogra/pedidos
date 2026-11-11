package com.nur.pedidos.restaurant.infrastructure.web;

import static com.nur.pedidos.shared.infrastructure.security.TestSessions.sessionOf;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

import com.nur.pedidos.restaurant.application.ListAllRestaurantsUseCase;
import com.nur.pedidos.restaurant.application.ReactivateRestaurantUseCase;
import com.nur.pedidos.restaurant.application.SuspendRestaurantUseCase;
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

@WebMvcTest(AdminRestaurantController.class)
@Import(SecurityConfig.class)
class AdminRestaurantControllerTest {

    private static final Instant NOW = Instant.parse("2026-11-10T15:00:00Z");
    private static final String LIST = "/api/v1/admin/restaurants";

    @Autowired
    private MockMvcTester mvc;

    @MockitoBean
    private ListAllRestaurantsUseCase listAllRestaurants;

    @MockitoBean
    private SuspendRestaurantUseCase suspendRestaurant;

    @MockitoBean
    private ReactivateRestaurantUseCase reactivateRestaurant;

    @Test
    void listsTheFirstPageOfEveryRestaurantAsAdmin() {
        when(listAllRestaurants.execute(0, 20))
                .thenReturn(new PageResult<>(
                        List.of(
                                restaurant(4L, "La Casona", "Comida criolla", true, false),
                                restaurant(5L, "Pizzería Napoli", null, false, true)),
                        0,
                        20,
                        2));

        var response = mvc.get().uri(LIST).with(sessionOf("ADMIN", 1L));

        assertThat(response).hasStatus(HttpStatus.OK).bodyJson().isStrictlyEqualTo("""
                {
                  "items": [
                    {
                      "id": 4,
                      "name": "La Casona",
                      "description": "Comida criolla",
                      "address": "Calle Sucre 245",
                      "open": true,
                      "suspended": false
                    },
                    {
                      "id": 5,
                      "name": "Pizzería Napoli",
                      "description": null,
                      "address": "Calle Sucre 245",
                      "open": false,
                      "suspended": true
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
    @CsvSource({"0, 1", "2, 20", "1000000, 100"})
    void listsTheRequestedPageAndSize(int page, int size) {
        when(listAllRestaurants.execute(page, size)).thenReturn(new PageResult<>(List.of(), page, size, 45));

        var response = mvc.get().uri(LIST + "?page=" + page + "&size=" + size).with(sessionOf("ADMIN", 1L));

        assertThat(response).hasStatus(HttpStatus.OK).bodyJson().satisfies(json -> {
            assertThat(json).extractingPath("$.page").isEqualTo(page);
            assertThat(json).extractingPath("$.size").isEqualTo(size);
            assertThat(json).extractingPath("$.totalItems").isEqualTo(45);
        });
        verify(listAllRestaurants).execute(page, size);
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
        var response = mvc.get().uri(LIST + "?" + query).with(sessionOf("ADMIN", 1L));

        assertThat(response).hasStatus(HttpStatus.BAD_REQUEST).bodyJson().satisfies(json -> {
            assertThat(json).extractingPath("$.code").isEqualTo("validation_failed");
            assertThat(json).extractingPath("$.errors[0].field").isEqualTo(field);
        });
        verifyNoInteractions(listAllRestaurants);
    }

    @Test
    void rejectsAListRequestWithoutSession() {
        assertThat(mvc.get().uri(LIST))
                .hasStatus(HttpStatus.UNAUTHORIZED)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("unauthenticated");
        verifyNoInteractions(listAllRestaurants);
    }

    @ParameterizedTest
    @ValueSource(strings = {"CUSTOMER", "OWNER"})
    void rejectsAListRequestFromAnotherRole(String role) {
        assertThat(mvc.get().uri(LIST).with(sessionOf(role, 7L)))
                .hasStatus(HttpStatus.FORBIDDEN)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("access_denied");
        verifyNoInteractions(listAllRestaurants);
    }

    @Test
    void suspendsTheRestaurantAsAdminAndReturnsItClosed() {
        when(suspendRestaurant.execute(4L)).thenReturn(restaurant(4L, "La Casona", "Comida criolla", false, true));

        var response = mvc.post()
                .uri("/api/v1/restaurants/4/suspend")
                .with(sessionOf("ADMIN", 1L))
                .with(csrf());

        assertThat(response).hasStatus(HttpStatus.OK).bodyJson().isStrictlyEqualTo("""
                {
                  "id": 4,
                  "name": "La Casona",
                  "description": "Comida criolla",
                  "address": "Calle Sucre 245",
                  "open": false,
                  "suspended": true
                }
                """);
    }

    @Test
    void reactivatesTheRestaurantAsAdminAndReturnsIt() {
        when(reactivateRestaurant.execute(4L)).thenReturn(restaurant(4L, "La Casona", "Comida criolla", false, false));

        var response = mvc.post()
                .uri("/api/v1/restaurants/4/reactivate")
                .with(sessionOf("ADMIN", 1L))
                .with(csrf());

        assertThat(response).hasStatus(HttpStatus.OK).bodyJson().satisfies(json -> {
            assertThat(json).extractingPath("$.id").isEqualTo(4);
            assertThat(json).extractingPath("$.open").isEqualTo(false);
            assertThat(json).extractingPath("$.suspended").isEqualTo(false);
        });
    }

    @ParameterizedTest
    @ValueSource(strings = {"suspend", "reactivate"})
    void rejectsAnActionWithoutSession(String action) {
        var response = mvc.post().uri("/api/v1/restaurants/4/" + action).with(csrf());

        assertThat(response)
                .hasStatus(HttpStatus.UNAUTHORIZED)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("unauthenticated");
        verifyNoInteractions(suspendRestaurant, reactivateRestaurant);
    }

    @ParameterizedTest
    @CsvSource({"suspend, CUSTOMER", "suspend, OWNER", "reactivate, CUSTOMER", "reactivate, OWNER"})
    void rejectsAnActionFromAnotherRole(String action, String role) {
        var response = mvc.post()
                .uri("/api/v1/restaurants/4/" + action)
                .with(sessionOf(role, 7L))
                .with(csrf());

        assertThat(response)
                .hasStatus(HttpStatus.FORBIDDEN)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("access_denied");
        verifyNoInteractions(suspendRestaurant, reactivateRestaurant);
    }

    @ParameterizedTest
    @ValueSource(strings = {"suspend", "reactivate"})
    void rejectsAnActionWithoutCsrfToken(String action) {
        var response = mvc.post().uri("/api/v1/restaurants/4/" + action).with(sessionOf("ADMIN", 1L));

        assertThat(response)
                .hasStatus(HttpStatus.FORBIDDEN)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("csrf_invalid");
        verifyNoInteractions(suspendRestaurant, reactivateRestaurant);
    }

    @ParameterizedTest
    @ValueSource(strings = {"suspend", "reactivate"})
    void rejectsAnIdThatIsNotANumber(String action) {
        var response = mvc.post()
                .uri("/api/v1/restaurants/abc/" + action)
                .with(sessionOf("ADMIN", 1L))
                .with(csrf());

        assertThat(response).hasStatus(HttpStatus.BAD_REQUEST).bodyJson().satisfies(json -> {
            assertThat(json).extractingPath("$.code").isEqualTo("validation_failed");
            assertThat(json).extractingPath("$.errors[0].field").isEqualTo("id");
        });
        verifyNoInteractions(suspendRestaurant, reactivateRestaurant);
    }

    @Test
    void returnsNotFoundWhenTheRestaurantToSuspendDoesNotExist() {
        when(suspendRestaurant.execute(99L)).thenThrow(new RestaurantNotFoundException());

        var response = mvc.post()
                .uri("/api/v1/restaurants/99/suspend")
                .with(sessionOf("ADMIN", 1L))
                .with(csrf());

        assertThat(response)
                .hasStatus(HttpStatus.NOT_FOUND)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("restaurant.not_found");
    }

    @Test
    void returnsNotFoundWhenTheRestaurantToReactivateDoesNotExist() {
        when(reactivateRestaurant.execute(99L)).thenThrow(new RestaurantNotFoundException());

        var response = mvc.post()
                .uri("/api/v1/restaurants/99/reactivate")
                .with(sessionOf("ADMIN", 1L))
                .with(csrf());

        assertThat(response)
                .hasStatus(HttpStatus.NOT_FOUND)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("restaurant.not_found");
    }

    private static Restaurant restaurant(Long id, String name, String description, boolean open, boolean suspended) {
        return new Restaurant(id, 7L, name, description, "Calle Sucre 245", open, suspended, NOW);
    }
}
