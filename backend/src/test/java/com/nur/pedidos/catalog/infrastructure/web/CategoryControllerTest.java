package com.nur.pedidos.catalog.infrastructure.web;

import static com.nur.pedidos.shared.infrastructure.security.TestSessions.sessionOf;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

import com.nur.pedidos.catalog.application.CreateCategoryCommand;
import com.nur.pedidos.catalog.application.CreateCategoryUseCase;
import com.nur.pedidos.catalog.application.DeleteCategoryUseCase;
import com.nur.pedidos.catalog.application.RenameCategoryCommand;
import com.nur.pedidos.catalog.application.RenameCategoryUseCase;
import com.nur.pedidos.catalog.domain.exception.CatalogNotOwnerException;
import com.nur.pedidos.catalog.domain.exception.CategoryNameTakenException;
import com.nur.pedidos.catalog.domain.exception.CategoryNotEmptyException;
import com.nur.pedidos.catalog.domain.exception.CategoryNotFoundException;
import com.nur.pedidos.catalog.domain.model.Category;
import com.nur.pedidos.restaurant.domain.exception.RestaurantNotFoundException;
import com.nur.pedidos.shared.infrastructure.security.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MockMvcTester.MockMvcRequestBuilder;

@WebMvcTest(CategoryController.class)
@Import(SecurityConfig.class)
class CategoryControllerTest {

    private static final String CATEGORIES = "/api/v1/restaurants/mine/categories";
    private static final String DRINKS = """
            {"name": "Bebidas"}
            """;

    @Autowired
    private MockMvcTester mvc;

    @MockitoBean
    private CreateCategoryUseCase createCategory;

    @MockitoBean
    private RenameCategoryUseCase renameCategory;

    @MockitoBean
    private DeleteCategoryUseCase deleteCategory;

    @Test
    void createsACategoryForTheOwnerInSession() {
        when(createCategory.execute(any())).thenReturn(new Category(5L, 4L, "Bebidas"));

        var response = asOwner(mvc.post().uri(CATEGORIES)).content(DRINKS);

        assertThat(response)
                .hasStatus(HttpStatus.CREATED)
                .hasHeader("Location", "/api/v1/restaurants/mine/categories/5")
                .bodyJson()
                .isStrictlyEqualTo("""
                        {"id": 5, "name": "Bebidas"}
                        """);
        verify(createCategory).execute(new CreateCategoryCommand(7L, "Bebidas"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"{\"name\": \"\"}", "{\"name\": \"   \"}", "{}", "{\"name\": null}"})
    void rejectsACategoryWithoutName(String body) {
        var response = asOwner(mvc.post().uri(CATEGORIES)).content(body);

        assertThat(response).hasStatus(HttpStatus.BAD_REQUEST).bodyJson().satisfies(json -> {
            assertThat(json).extractingPath("$.code").isEqualTo("validation_failed");
            assertThat(json).extractingPath("$.errors[0].field").isEqualTo("name");
        });
        verifyNoInteractions(createCategory);
    }

    @Test
    void rejectsANameLongerThanItsColumn() {
        var response = asOwner(mvc.post().uri(CATEGORIES)).content(named("a".repeat(61)));

        assertThat(response)
                .hasStatus(HttpStatus.BAD_REQUEST)
                .bodyJson()
                .extractingPath("$.errors[0].field")
                .isEqualTo("name");
        verifyNoInteractions(createCategory);
    }

    @Test
    void acceptsANameAtItsLimit() {
        when(createCategory.execute(any())).thenReturn(new Category(5L, 4L, "a".repeat(60)));

        assertThat(asOwner(mvc.post().uri(CATEGORIES)).content(named("a".repeat(60))))
                .hasStatus(HttpStatus.CREATED);
    }

    @Test
    void refusesANameTheRestaurantAlreadyUses() {
        when(createCategory.execute(any())).thenThrow(new CategoryNameTakenException());

        assertThat(asOwner(mvc.post().uri(CATEGORIES)).content(DRINKS))
                .hasStatus(HttpStatus.CONFLICT)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("catalog.category_name_taken");
    }

    @Test
    void returnsNotFoundWhenTheOwnerHasNoRestaurant() {
        when(createCategory.execute(any())).thenThrow(new RestaurantNotFoundException());

        assertThat(asOwner(mvc.post().uri(CATEGORIES)).content(DRINKS))
                .hasStatus(HttpStatus.NOT_FOUND)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("restaurant.not_found");
    }

    @Test
    void renamesACategoryOfTheOwnerInSession() {
        when(renameCategory.execute(any())).thenReturn(new Category(5L, 4L, "Refrescos"));

        var response = asOwner(mvc.put().uri(CATEGORIES + "/5")).content(named("Refrescos"));

        assertThat(response).hasStatus(HttpStatus.OK).bodyJson().isStrictlyEqualTo("""
                {"id": 5, "name": "Refrescos"}
                """);
        verify(renameCategory).execute(new RenameCategoryCommand(7L, 5L, "Refrescos"));
    }

    @Test
    void rejectsARenameWithoutName() {
        var response = asOwner(mvc.put().uri(CATEGORIES + "/5")).content(named("  "));

        assertThat(response)
                .hasStatus(HttpStatus.BAD_REQUEST)
                .bodyJson()
                .extractingPath("$.errors[0].field")
                .isEqualTo("name");
        verifyNoInteractions(renameCategory);
    }

    @Test
    void refusesToRenameACategoryOfAnotherRestaurant() {
        when(renameCategory.execute(any())).thenThrow(new CatalogNotOwnerException());

        assertThat(asOwner(mvc.put().uri(CATEGORIES + "/5")).content(DRINKS))
                .hasStatus(HttpStatus.FORBIDDEN)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("catalog.not_owner");
    }

    @Test
    void returnsNotFoundWhenRenamingAMissingCategory() {
        when(renameCategory.execute(any())).thenThrow(new CategoryNotFoundException());

        assertThat(asOwner(mvc.put().uri(CATEGORIES + "/99")).content(DRINKS))
                .hasStatus(HttpStatus.NOT_FOUND)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("catalog.category_not_found");
    }

    @Test
    void rejectsAnIdThatIsNotANumber() {
        assertThat(asOwner(mvc.put().uri(CATEGORIES + "/bebidas")).content(DRINKS))
                .hasStatus(HttpStatus.BAD_REQUEST)
                .bodyJson()
                .satisfies(json -> {
                    assertThat(json).extractingPath("$.code").isEqualTo("validation_failed");
                    assertThat(json).extractingPath("$.errors[0].field").isEqualTo("id");
                });
        verifyNoInteractions(renameCategory);
    }

    @Test
    void deletesACategoryOfTheOwnerInSession() {
        var response =
                mvc.delete().uri(CATEGORIES + "/5").with(sessionOf("OWNER", 7L)).with(csrf());

        assertThat(response).hasStatus(HttpStatus.NO_CONTENT);
        verify(deleteCategory).execute(7L, 5L);
    }

    @Test
    void refusesToDeleteACategoryWithProducts() {
        doThrow(new CategoryNotEmptyException()).when(deleteCategory).execute(7L, 5L);

        var response =
                mvc.delete().uri(CATEGORIES + "/5").with(sessionOf("OWNER", 7L)).with(csrf());

        assertThat(response)
                .hasStatus(HttpStatus.CONFLICT)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("catalog.category_not_empty");
    }

    @ParameterizedTest
    @CsvSource({"POST, ''", "PUT, /5", "DELETE, /5"})
    void rejectsAChangeWithoutSession(HttpMethod method, String path) {
        var response = withBody(mvc.method(method).uri(CATEGORIES + path).with(csrf()));

        assertThat(response)
                .hasStatus(HttpStatus.UNAUTHORIZED)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("unauthenticated");
        verifyNoInteractions(createCategory, renameCategory, deleteCategory);
    }

    @ParameterizedTest
    @CsvSource({
        "POST, '', CUSTOMER",
        "POST, '', ADMIN",
        "PUT, /5, CUSTOMER",
        "PUT, /5, ADMIN",
        "DELETE, /5, CUSTOMER",
        "DELETE, /5, ADMIN"
    })
    void rejectsAChangeFromAnotherRole(HttpMethod method, String path, String role) {
        var response = withBody(mvc.method(method)
                .uri(CATEGORIES + path)
                .with(sessionOf(role, 3L))
                .with(csrf()));

        assertThat(response)
                .hasStatus(HttpStatus.FORBIDDEN)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("access_denied");
        verifyNoInteractions(createCategory, renameCategory, deleteCategory);
    }

    @ParameterizedTest
    @CsvSource({"POST, ''", "PUT, /5", "DELETE, /5"})
    void rejectsAChangeWithoutCsrfToken(HttpMethod method, String path) {
        var response = withBody(mvc.method(method).uri(CATEGORIES + path).with(sessionOf("OWNER", 7L)));

        assertThat(response)
                .hasStatus(HttpStatus.FORBIDDEN)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("csrf_invalid");
        verifyNoInteractions(createCategory, renameCategory, deleteCategory);
    }

    private static MockMvcRequestBuilder asOwner(MockMvcRequestBuilder request) {
        return request.with(sessionOf("OWNER", 7L)).with(csrf()).contentType(MediaType.APPLICATION_JSON);
    }

    private static MockMvcRequestBuilder withBody(MockMvcRequestBuilder request) {
        return request.contentType(MediaType.APPLICATION_JSON).content(DRINKS);
    }

    private static String named(String name) {
        return """
                {"name": "%s"}
                """.formatted(name);
    }
}
