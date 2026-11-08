package com.nur.pedidos.restaurant.infrastructure.web;

import static com.nur.pedidos.shared.infrastructure.security.TestSessions.sessionOf;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

import com.nur.pedidos.restaurant.application.CloseRestaurantUseCase;
import com.nur.pedidos.restaurant.application.GetOwnRestaurantUseCase;
import com.nur.pedidos.restaurant.application.OpenRestaurantUseCase;
import com.nur.pedidos.restaurant.application.RegisterRestaurantCommand;
import com.nur.pedidos.restaurant.application.RegisterRestaurantUseCase;
import com.nur.pedidos.restaurant.domain.exception.RestaurantAlreadyRegisteredException;
import com.nur.pedidos.restaurant.domain.exception.RestaurantNotFoundException;
import com.nur.pedidos.restaurant.domain.exception.RestaurantSuspendedException;
import com.nur.pedidos.restaurant.domain.model.Restaurant;
import com.nur.pedidos.shared.infrastructure.security.SecurityConfig;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

@WebMvcTest(RestaurantController.class)
@Import(SecurityConfig.class)
class RestaurantControllerTest {

    private static final Instant NOW = Instant.parse("2026-11-07T15:00:00Z");
    private static final String REGISTRATION = """
            {"name": "La Casona", "description": "Comida criolla", "address": "Calle Sucre 245"}
            """;

    @Autowired
    private MockMvcTester mvc;

    @MockitoBean
    private RegisterRestaurantUseCase registerRestaurant;

    @MockitoBean
    private GetOwnRestaurantUseCase getOwnRestaurant;

    @MockitoBean
    private OpenRestaurantUseCase openRestaurant;

    @MockitoBean
    private CloseRestaurantUseCase closeRestaurant;

    @Test
    void registersARestaurantForTheOwnerInSession() {
        when(registerRestaurant.execute(any())).thenReturn(laCasona(false, false));

        var response = mvc.post()
                .uri("/api/v1/restaurants")
                .with(sessionOf("OWNER", 7L))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(REGISTRATION);

        assertThat(response)
                .hasStatus(HttpStatus.CREATED)
                .hasHeader("Location", "/api/v1/restaurants/mine")
                .bodyJson()
                .isStrictlyEqualTo("""
                        {
                          "id": 1,
                          "name": "La Casona",
                          "description": "Comida criolla",
                          "address": "Calle Sucre 245",
                          "open": false,
                          "suspended": false
                        }
                        """);
        verify(registerRestaurant)
                .execute(new RegisterRestaurantCommand(7L, "La Casona", "Comida criolla", "Calle Sucre 245"));
    }

    @Test
    void registersARestaurantWithoutDescription() {
        when(registerRestaurant.execute(any()))
                .thenReturn(new Restaurant(1L, 7L, "La Casona", null, "Calle Sucre 245", false, false, NOW));

        var response = mvc.post()
                .uri("/api/v1/restaurants")
                .with(sessionOf("OWNER", 7L))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name": "La Casona", "address": "Calle Sucre 245"}
                        """);

        assertThat(response)
                .hasStatus(HttpStatus.CREATED)
                .bodyJson()
                .extractingPath("$.description")
                .isNull();
        verify(registerRestaurant).execute(new RegisterRestaurantCommand(7L, "La Casona", null, "Calle Sucre 245"));
    }

    @ParameterizedTest
    @CsvSource(
            delimiter = '|',
            value = {
                "{\"name\": \"\", \"address\": \"Calle Sucre 245\"}                         | name",
                "{\"name\": \"   \", \"address\": \"Calle Sucre 245\"}                      | name",
                "{\"address\": \"Calle Sucre 245\"}                                         | name",
                "{\"name\": \"La Casona\", \"address\": \"\"}                               | address",
                "{\"name\": \"La Casona\"}                                                  | address"
            })
    void rejectsARegistrationWithoutARequiredField(String body, String field) {
        var response = mvc.post()
                .uri("/api/v1/restaurants")
                .with(sessionOf("OWNER", 7L))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(body);

        assertThat(response).hasStatus(HttpStatus.BAD_REQUEST).bodyJson().satisfies(json -> {
            assertThat(json).extractingPath("$.code").isEqualTo("validation_failed");
            assertThat(json).extractingPath("$.errors[0].field").isEqualTo(field);
        });
        verifyNoInteractions(registerRestaurant);
    }

    @ParameterizedTest
    @CsvSource({"name, 121", "description, 301", "address, 201"})
    void rejectsAFieldLongerThanItsColumn(String field, int length) {
        String body = """
                {"name": "La Casona", "address": "Calle Sucre 245", "%s": "%s"}
                """.formatted(field, "a".repeat(length));

        var response = mvc.post()
                .uri("/api/v1/restaurants")
                .with(sessionOf("OWNER", 7L))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(body);

        assertThat(response).hasStatus(HttpStatus.BAD_REQUEST).bodyJson().satisfies(json -> {
            assertThat(json).extractingPath("$.code").isEqualTo("validation_failed");
            assertThat(json).extractingPath("$.errors[0].field").isEqualTo(field);
        });
        verifyNoInteractions(registerRestaurant);
    }

    @Test
    void acceptsEachFieldAtItsLimit() {
        when(registerRestaurant.execute(any())).thenReturn(laCasona(false, false));
        String body = """
                {"name": "%s", "description": "%s", "address": "%s"}
                """.formatted("a".repeat(120), "b".repeat(300), "c".repeat(200));

        var response = mvc.post()
                .uri("/api/v1/restaurants")
                .with(sessionOf("OWNER", 7L))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(body);

        assertThat(response).hasStatus(HttpStatus.CREATED);
    }

    @Test
    void refusesASecondRestaurantForTheSameOwner() {
        when(registerRestaurant.execute(any())).thenThrow(new RestaurantAlreadyRegisteredException());

        var response = mvc.post()
                .uri("/api/v1/restaurants")
                .with(sessionOf("OWNER", 7L))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(REGISTRATION);

        assertThat(response)
                .hasStatus(HttpStatus.CONFLICT)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("restaurant.already_registered");
    }

    @Test
    void rejectsARegistrationWithoutSession() {
        var response = mvc.post()
                .uri("/api/v1/restaurants")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(REGISTRATION);

        assertThat(response)
                .hasStatus(HttpStatus.UNAUTHORIZED)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("unauthenticated");
        verifyNoInteractions(registerRestaurant);
    }

    @ParameterizedTest
    @ValueSource(strings = {"CUSTOMER", "ADMIN"})
    void rejectsARegistrationFromAnotherRole(String role) {
        var response = mvc.post()
                .uri("/api/v1/restaurants")
                .with(sessionOf(role, 3L))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(REGISTRATION);

        assertThat(response)
                .hasStatus(HttpStatus.FORBIDDEN)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("access_denied");
        verifyNoInteractions(registerRestaurant);
    }

    @Test
    void rejectsARegistrationWithoutCsrfToken() {
        var response = mvc.post()
                .uri("/api/v1/restaurants")
                .with(sessionOf("OWNER", 7L))
                .contentType(MediaType.APPLICATION_JSON)
                .content(REGISTRATION);

        assertThat(response)
                .hasStatus(HttpStatus.FORBIDDEN)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("csrf_invalid");
        verifyNoInteractions(registerRestaurant);
    }

    @Test
    void returnsTheRestaurantOfTheOwnerInSession() {
        when(getOwnRestaurant.execute(7L)).thenReturn(laCasona(true, false));

        var response = mvc.get().uri("/api/v1/restaurants/mine").with(sessionOf("OWNER", 7L));

        assertThat(response).hasStatus(HttpStatus.OK).bodyJson().isStrictlyEqualTo("""
                {
                  "id": 1,
                  "name": "La Casona",
                  "description": "Comida criolla",
                  "address": "Calle Sucre 245",
                  "open": true,
                  "suspended": false
                }
                """);
    }

    @Test
    void returnsNotFoundWhenTheOwnerHasNoRestaurant() {
        when(getOwnRestaurant.execute(7L)).thenThrow(new RestaurantNotFoundException());

        assertThat(mvc.get().uri("/api/v1/restaurants/mine").with(sessionOf("OWNER", 7L)))
                .hasStatus(HttpStatus.NOT_FOUND)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("restaurant.not_found");
    }

    @Test
    void rejectsReadingTheRestaurantWithoutSession() {
        assertThat(mvc.get().uri("/api/v1/restaurants/mine"))
                .hasStatus(HttpStatus.UNAUTHORIZED)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("unauthenticated");
        verifyNoInteractions(getOwnRestaurant);
    }

    @ParameterizedTest
    @ValueSource(strings = {"CUSTOMER", "ADMIN"})
    void rejectsReadingTheRestaurantFromAnotherRole(String role) {
        assertThat(mvc.get().uri("/api/v1/restaurants/mine").with(sessionOf(role, 3L)))
                .hasStatus(HttpStatus.FORBIDDEN)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("access_denied");
        verifyNoInteractions(getOwnRestaurant);
    }

    @Test
    void opensTheRestaurantOfTheOwnerInSession() {
        var response = mvc.post()
                .uri("/api/v1/restaurants/mine/open")
                .with(sessionOf("OWNER", 7L))
                .with(csrf());

        assertThat(response).hasStatus(HttpStatus.NO_CONTENT);
        verify(openRestaurant).execute(7L);
    }

    @Test
    void closesTheRestaurantOfTheOwnerInSession() {
        var response = mvc.post()
                .uri("/api/v1/restaurants/mine/close")
                .with(sessionOf("OWNER", 7L))
                .with(csrf());

        assertThat(response).hasStatus(HttpStatus.NO_CONTENT);
        verify(closeRestaurant).execute(7L);
    }

    @Test
    void refusesToOpenASuspendedRestaurant() {
        doThrow(new RestaurantSuspendedException()).when(openRestaurant).execute(7L);

        var response = mvc.post()
                .uri("/api/v1/restaurants/mine/open")
                .with(sessionOf("OWNER", 7L))
                .with(csrf());

        assertThat(response)
                .hasStatus(HttpStatus.CONFLICT)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("restaurant.suspended");
    }

    @Test
    void returnsNotFoundWhenTheOwnerOpensWithoutARestaurant() {
        doThrow(new RestaurantNotFoundException()).when(openRestaurant).execute(7L);

        var response = mvc.post()
                .uri("/api/v1/restaurants/mine/open")
                .with(sessionOf("OWNER", 7L))
                .with(csrf());

        assertThat(response)
                .hasStatus(HttpStatus.NOT_FOUND)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("restaurant.not_found");
    }

    @Test
    void returnsNotFoundWhenTheOwnerClosesWithoutARestaurant() {
        doThrow(new RestaurantNotFoundException()).when(closeRestaurant).execute(7L);

        var response = mvc.post()
                .uri("/api/v1/restaurants/mine/close")
                .with(sessionOf("OWNER", 7L))
                .with(csrf());

        assertThat(response)
                .hasStatus(HttpStatus.NOT_FOUND)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("restaurant.not_found");
    }

    @ParameterizedTest
    @ValueSource(strings = {"open", "close"})
    void rejectsAnActionWithoutSession(String action) {
        var response = mvc.post().uri("/api/v1/restaurants/mine/" + action).with(csrf());

        assertThat(response)
                .hasStatus(HttpStatus.UNAUTHORIZED)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("unauthenticated");
        verifyNoInteractions(openRestaurant, closeRestaurant);
    }

    @ParameterizedTest
    @CsvSource({"open, CUSTOMER", "open, ADMIN", "close, CUSTOMER", "close, ADMIN"})
    void rejectsAnActionFromAnotherRole(String action, String role) {
        var response = mvc.post()
                .uri("/api/v1/restaurants/mine/" + action)
                .with(sessionOf(role, 3L))
                .with(csrf());

        assertThat(response)
                .hasStatus(HttpStatus.FORBIDDEN)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("access_denied");
        verifyNoInteractions(openRestaurant, closeRestaurant);
    }

    @ParameterizedTest
    @ValueSource(strings = {"open", "close"})
    void rejectsAnActionWithoutCsrfToken(String action) {
        var response = mvc.post().uri("/api/v1/restaurants/mine/" + action).with(sessionOf("OWNER", 7L));

        assertThat(response)
                .hasStatus(HttpStatus.FORBIDDEN)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("csrf_invalid");
        verifyNoInteractions(openRestaurant, closeRestaurant);
    }

    private static Restaurant laCasona(boolean open, boolean suspended) {
        return new Restaurant(1L, 7L, "La Casona", "Comida criolla", "Calle Sucre 245", open, suspended, NOW);
    }
}
