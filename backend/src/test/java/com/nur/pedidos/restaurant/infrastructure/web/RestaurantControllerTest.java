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
import com.nur.pedidos.restaurant.application.EditRestaurantCommand;
import com.nur.pedidos.restaurant.application.EditRestaurantUseCase;
import com.nur.pedidos.restaurant.application.GetOwnRestaurantUseCase;
import com.nur.pedidos.restaurant.application.OpenRestaurantUseCase;
import com.nur.pedidos.restaurant.application.RegisterRestaurantCommand;
import com.nur.pedidos.restaurant.application.RegisterRestaurantUseCase;
import com.nur.pedidos.restaurant.domain.exception.RestaurantAlreadyRegisteredException;
import com.nur.pedidos.restaurant.domain.exception.RestaurantNotFoundException;
import com.nur.pedidos.restaurant.domain.exception.RestaurantSuspendedException;
import com.nur.pedidos.restaurant.domain.model.Restaurant;
import com.nur.pedidos.restaurant.domain.model.RestaurantCategory;
import com.nur.pedidos.shared.domain.exception.DomainException;
import com.nur.pedidos.shared.infrastructure.security.SecurityConfig;
import java.time.Instant;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.MethodSource;
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
            {"name": "La Casona", "description": "Comida criolla", "address": "Calle Sucre 245", "category": "TRADITIONAL"}
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

    @MockitoBean
    private EditRestaurantUseCase editRestaurant;

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
                          "category": "TRADITIONAL",
                          "imageUrl": null,
                          "open": false,
                          "suspended": false
                        }
                        """);
        verify(registerRestaurant)
                .execute(new RegisterRestaurantCommand(
                        7L, "La Casona", "Comida criolla", "Calle Sucre 245", RestaurantCategory.TRADITIONAL, null));
    }

    @Test
    void registersARestaurantWithoutDescription() {
        when(registerRestaurant.execute(any()))
                .thenReturn(new Restaurant(
                        1L,
                        7L,
                        "La Casona",
                        null,
                        "Calle Sucre 245",
                        RestaurantCategory.TRADITIONAL,
                        null,
                        false,
                        false,
                        NOW));

        var response = mvc.post()
                .uri("/api/v1/restaurants")
                .with(sessionOf("OWNER", 7L))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name": "La Casona", "address": "Calle Sucre 245", "category": "TRADITIONAL"}
                        """);

        assertThat(response)
                .hasStatus(HttpStatus.CREATED)
                .bodyJson()
                .extractingPath("$.description")
                .isNull();
        verify(registerRestaurant)
                .execute(new RegisterRestaurantCommand(
                        7L, "La Casona", null, "Calle Sucre 245", RestaurantCategory.TRADITIONAL, null));
    }

    @ParameterizedTest
    @CsvSource(
            delimiter = '|',
            value = {
                "{\"name\": \"\", \"address\": \"Calle Sucre 245\", \"category\": \"TRADITIONAL\"}                         | name",
                "{\"name\": \"   \", \"address\": \"Calle Sucre 245\", \"category\": \"TRADITIONAL\"}                      | name",
                "{\"address\": \"Calle Sucre 245\", \"category\": \"TRADITIONAL\"}                                         | name",
                "{\"name\": \"La Casona\", \"address\": \"\", \"category\": \"TRADITIONAL\"}                               | address",
                "{\"name\": \"La Casona\", \"category\": \"TRADITIONAL\"}                                                  | address"
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
    @MethodSource("fieldsLongerThanTheirColumn")
    void rejectsAFieldLongerThanItsColumn(String body, String field) {
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

        var response = mvc.post()
                .uri("/api/v1/restaurants")
                .with(sessionOf("OWNER", 7L))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(registration("a".repeat(120), "b".repeat(300), "c".repeat(200)));

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
                  "category": "TRADITIONAL",
                  "imageUrl": null,
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

    @Test
    void registersARestaurantWithItsCategoryAndImage() {
        when(registerRestaurant.execute(any())).thenReturn(laCasona(false, false));

        var response = mvc.post()
                .uri("/api/v1/restaurants")
                .with(sessionOf("OWNER", 7L))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name": "La Casona", "address": "Calle Sucre 245", "category": "GRILL", "imageUrl": "https://fotos.pedidos.test/casona.jpg"}
                        """);

        assertThat(response).hasStatus(HttpStatus.CREATED);
        verify(registerRestaurant)
                .execute(new RegisterRestaurantCommand(
                        7L,
                        "La Casona",
                        null,
                        "Calle Sucre 245",
                        RestaurantCategory.GRILL,
                        "https://fotos.pedidos.test/casona.jpg"));
    }

    @ParameterizedTest
    @ValueSource(
            strings = {
                "{\"name\": \"La Casona\", \"address\": \"Calle Sucre 245\"}",
                "{\"name\": \"La Casona\", \"address\": \"Calle Sucre 245\", \"category\": null}"
            })
    void rejectsARestaurantWithoutCategory(String body) {
        var response = mvc.post()
                .uri("/api/v1/restaurants")
                .with(sessionOf("OWNER", 7L))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(body);

        assertThat(response).hasStatus(HttpStatus.BAD_REQUEST).bodyJson().satisfies(json -> {
            assertThat(json).extractingPath("$.code").isEqualTo("validation_failed");
            assertThat(json).extractingPath("$.errors[0].field").isEqualTo("category");
        });
        verifyNoInteractions(registerRestaurant);
    }

    @Test
    void rejectsACategoryThatIsNotOnTheList() {
        var response = mvc.post()
                .uri("/api/v1/restaurants")
                .with(sessionOf("OWNER", 7L))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name": "La Casona", "address": "Calle Sucre 245", "category": "PIZZERIA"}
                        """);

        assertThat(response)
                .hasStatus(HttpStatus.BAD_REQUEST)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("validation_failed");
        verifyNoInteractions(registerRestaurant);
    }

    @Test
    void editsTheRestaurantOfTheOwnerInSession() {
        when(editRestaurant.execute(any())).thenReturn(laCasona(true, false));

        var response = mvc.put()
                .uri("/api/v1/restaurants/mine")
                .with(sessionOf("OWNER", 7L))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name": "La Casona", "description": "Comida criolla", "address": "Calle Sucre 245", "category": "TRADITIONAL", "imageUrl": "https://fotos.pedidos.test/casona.jpg"}
                        """);

        assertThat(response).hasStatus(HttpStatus.OK).bodyJson().satisfies(json -> {
            assertThat(json).extractingPath("$.name").isEqualTo("La Casona");
            assertThat(json).extractingPath("$.category").isEqualTo("TRADITIONAL");
            assertThat(json).extractingPath("$.open").isEqualTo(true);
        });
        verify(editRestaurant)
                .execute(new EditRestaurantCommand(
                        7L,
                        "La Casona",
                        "Comida criolla",
                        "Calle Sucre 245",
                        RestaurantCategory.TRADITIONAL,
                        "https://fotos.pedidos.test/casona.jpg"));
    }

    @Test
    void rejectsAnEditWithoutAName() {
        var response = mvc.put()
                .uri("/api/v1/restaurants/mine")
                .with(sessionOf("OWNER", 7L))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name": " ", "address": "Calle Sucre 245", "category": "TRADITIONAL"}
                        """);

        assertThat(response).hasStatus(HttpStatus.BAD_REQUEST).bodyJson().satisfies(json -> {
            assertThat(json).extractingPath("$.code").isEqualTo("validation_failed");
            assertThat(json).extractingPath("$.errors[0].field").isEqualTo("name");
        });
        verifyNoInteractions(editRestaurant);
    }

    @Test
    void answersAnImageThatIsNotAWebAddressWithItsCode() {
        when(editRestaurant.execute(any()))
                .thenThrow(new DomainException("restaurant.invalid_image_url", "La imagen no es válida"));

        var response = mvc.put()
                .uri("/api/v1/restaurants/mine")
                .with(sessionOf("OWNER", 7L))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name": "La Casona", "address": "Calle Sucre 245", "category": "TRADITIONAL", "imageUrl": "foto.jpg"}
                        """);

        assertThat(response)
                .hasStatus(HttpStatus.UNPROCESSABLE_CONTENT)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("restaurant.invalid_image_url");
    }

    @Test
    void returnsNotFoundWhenTheOwnerEditsWithoutARestaurant() {
        when(editRestaurant.execute(any())).thenThrow(new RestaurantNotFoundException());

        var response = mvc.put()
                .uri("/api/v1/restaurants/mine")
                .with(sessionOf("OWNER", 7L))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(REGISTRATION);

        assertThat(response)
                .hasStatus(HttpStatus.NOT_FOUND)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("restaurant.not_found");
    }

    @Test
    void rejectsAnEditWithoutSession() {
        var response = mvc.put()
                .uri("/api/v1/restaurants/mine")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(REGISTRATION);

        assertThat(response)
                .hasStatus(HttpStatus.UNAUTHORIZED)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("unauthenticated");
        verifyNoInteractions(editRestaurant);
    }

    @ParameterizedTest
    @ValueSource(strings = {"CUSTOMER", "ADMIN"})
    void rejectsAnEditFromAnotherRole(String role) {
        var response = mvc.put()
                .uri("/api/v1/restaurants/mine")
                .with(sessionOf(role, 3L))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(REGISTRATION);

        assertThat(response)
                .hasStatus(HttpStatus.FORBIDDEN)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("access_denied");
        verifyNoInteractions(editRestaurant);
    }

    @Test
    void rejectsAnEditWithoutCsrfToken() {
        var response = mvc.put()
                .uri("/api/v1/restaurants/mine")
                .with(sessionOf("OWNER", 7L))
                .contentType(MediaType.APPLICATION_JSON)
                .content(REGISTRATION);

        assertThat(response)
                .hasStatus(HttpStatus.FORBIDDEN)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("csrf_invalid");
        verifyNoInteractions(editRestaurant);
    }

    static Stream<Arguments> fieldsLongerThanTheirColumn() {
        return Stream.of(
                Arguments.of(registration("a".repeat(121), null, "Calle Sucre 245"), "name"),
                Arguments.of(registration("La Casona", "a".repeat(301), "Calle Sucre 245"), "description"),
                Arguments.of(registration("La Casona", null, "a".repeat(201)), "address"),
                Arguments.of("""
                        {"name": "La Casona", "address": "Calle Sucre 245", "category": "TRADITIONAL", "imageUrl": "https://fotos.pedidos.test/%s"}
                        """.formatted("a".repeat(480)), "imageUrl"));
    }

    private static String registration(String name, String description, String address) {
        return """
                {"name": %s, "description": %s, "address": %s, "category": "TRADITIONAL"}
                """.formatted(quoted(name), quoted(description), quoted(address));
    }

    private static String quoted(String value) {
        return value == null ? "null" : '"' + value + '"';
    }

    private static Restaurant laCasona(boolean open, boolean suspended) {
        return new Restaurant(
                1L,
                7L,
                "La Casona",
                "Comida criolla",
                "Calle Sucre 245",
                RestaurantCategory.TRADITIONAL,
                null,
                open,
                suspended,
                NOW);
    }
}
