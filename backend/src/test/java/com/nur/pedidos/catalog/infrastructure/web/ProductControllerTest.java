package com.nur.pedidos.catalog.infrastructure.web;

import static com.nur.pedidos.shared.infrastructure.security.TestSessions.sessionOf;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

import com.nur.pedidos.catalog.application.CreateProductCommand;
import com.nur.pedidos.catalog.application.CreateProductUseCase;
import com.nur.pedidos.catalog.application.DeleteProductUseCase;
import com.nur.pedidos.catalog.application.EditProductCommand;
import com.nur.pedidos.catalog.application.EditProductUseCase;
import com.nur.pedidos.catalog.application.MarkProductAvailableUseCase;
import com.nur.pedidos.catalog.application.MarkProductSoldOutUseCase;
import com.nur.pedidos.catalog.domain.exception.CatalogNotOwnerException;
import com.nur.pedidos.catalog.domain.exception.CategoryNotFoundException;
import com.nur.pedidos.catalog.domain.exception.ProductNotFoundException;
import com.nur.pedidos.catalog.domain.model.Product;
import com.nur.pedidos.restaurant.domain.exception.RestaurantNotFoundException;
import com.nur.pedidos.shared.infrastructure.security.SecurityConfig;
import java.math.BigDecimal;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
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

@WebMvcTest(ProductController.class)
@Import(SecurityConfig.class)
class ProductControllerTest {

    private static final String PRODUCTS = "/api/v1/restaurants/mine/products";
    private static final String SILPANCHO = """
            {"categoryId": 3, "name": "Silpancho", "description": "Con arroz y huevo", "price": 45.50}
            """;

    @Autowired
    private MockMvcTester mvc;

    @MockitoBean
    private CreateProductUseCase createProduct;

    @MockitoBean
    private EditProductUseCase editProduct;

    @MockitoBean
    private DeleteProductUseCase deleteProduct;

    @MockitoBean
    private MarkProductSoldOutUseCase markProductSoldOut;

    @MockitoBean
    private MarkProductAvailableUseCase markProductAvailable;

    @Test
    void createsAProductForTheOwnerInSession() {
        when(createProduct.execute(any())).thenReturn(silpancho(true));

        var response = asOwner(mvc.post().uri(PRODUCTS)).content(SILPANCHO);

        assertThat(response)
                .hasStatus(HttpStatus.CREATED)
                .hasHeader("Location", "/api/v1/restaurants/mine/products/10")
                .bodyJson()
                .isStrictlyEqualTo("""
                        {
                          "id": 10,
                          "categoryId": 3,
                          "name": "Silpancho",
                          "description": "Con arroz y huevo",
                          "price": 45.50,
                          "available": true,
                          "imageUrl": null
                        }
                        """);
        verify(createProduct)
                .execute(new CreateProductCommand(
                        7L, 3L, "Silpancho", "Con arroz y huevo", new BigDecimal("45.50"), null));
    }

    @ParameterizedTest
    @MethodSource("invalidProducts")
    void rejectsAProductThatBreaksTheFormat(String body, String field) {
        var response = asOwner(mvc.post().uri(PRODUCTS)).content(body);

        assertThat(response).hasStatus(HttpStatus.BAD_REQUEST).bodyJson().satisfies(json -> {
            assertThat(json).extractingPath("$.code").isEqualTo("validation_failed");
            assertThat(json).extractingPath("$.errors[0].field").isEqualTo(field);
        });
        verifyNoInteractions(createProduct);
    }

    @Test
    void acceptsEachFieldAtItsLimit() {
        when(createProduct.execute(any())).thenReturn(silpancho(true));

        var response = asOwner(mvc.post().uri(PRODUCTS))
                .content(product("3", quoted("a".repeat(120)), quoted("b".repeat(300)), "9999999999.99"));

        assertThat(response).hasStatus(HttpStatus.CREATED);
        verify(createProduct)
                .execute(new CreateProductCommand(
                        7L, 3L, "a".repeat(120), "b".repeat(300), new BigDecimal("9999999999.99"), null));
    }

    @Test
    void acceptsTheSmallestPrice() {
        when(createProduct.execute(any())).thenReturn(silpancho(true));

        var response = asOwner(mvc.post().uri(PRODUCTS)).content(product("3", quoted("Chicle"), "null", "0.01"));

        assertThat(response).hasStatus(HttpStatus.CREATED);
    }

    @Test
    void returnsNotFoundWhenTheCategoryDoesNotExist() {
        when(createProduct.execute(any())).thenThrow(new CategoryNotFoundException());

        assertThat(asOwner(mvc.post().uri(PRODUCTS)).content(SILPANCHO))
                .hasStatus(HttpStatus.NOT_FOUND)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("catalog.category_not_found");
    }

    @Test
    void refusesACategoryOfAnotherRestaurant() {
        when(createProduct.execute(any())).thenThrow(new CatalogNotOwnerException());

        assertThat(asOwner(mvc.post().uri(PRODUCTS)).content(SILPANCHO))
                .hasStatus(HttpStatus.FORBIDDEN)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("catalog.not_owner");
    }

    @Test
    void returnsNotFoundWhenTheOwnerHasNoRestaurant() {
        when(createProduct.execute(any())).thenThrow(new RestaurantNotFoundException());

        assertThat(asOwner(mvc.post().uri(PRODUCTS)).content(SILPANCHO))
                .hasStatus(HttpStatus.NOT_FOUND)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("restaurant.not_found");
    }

    @Test
    void editsAProductOfTheOwnerInSession() {
        when(editProduct.execute(any())).thenReturn(silpancho(false));

        var response = asOwner(mvc.put().uri(PRODUCTS + "/10")).content(SILPANCHO);

        assertThat(response)
                .hasStatus(HttpStatus.OK)
                .bodyJson()
                .extractingPath("$.available")
                .isEqualTo(false);
        verify(editProduct)
                .execute(new EditProductCommand(
                        7L, 10L, 3L, "Silpancho", "Con arroz y huevo", new BigDecimal("45.50"), null));
    }

    @Test
    void rejectsAnEditThatBreaksTheFormat() {
        var response = asOwner(mvc.put().uri(PRODUCTS + "/10")).content(product("3", quoted("Silpancho"), "null", "0"));

        assertThat(response)
                .hasStatus(HttpStatus.BAD_REQUEST)
                .bodyJson()
                .extractingPath("$.errors[0].field")
                .isEqualTo("price");
        verifyNoInteractions(editProduct);
    }

    @Test
    void returnsNotFoundWhenEditingAMissingProduct() {
        when(editProduct.execute(any())).thenThrow(new ProductNotFoundException());

        assertThat(asOwner(mvc.put().uri(PRODUCTS + "/99")).content(SILPANCHO))
                .hasStatus(HttpStatus.NOT_FOUND)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("catalog.product_not_found");
    }

    @Test
    void deletesAProductOfTheOwnerInSession() {
        var response =
                mvc.delete().uri(PRODUCTS + "/10").with(sessionOf("OWNER", 7L)).with(csrf());

        assertThat(response).hasStatus(HttpStatus.NO_CONTENT);
        verify(deleteProduct).execute(7L, 10L);
    }

    @Test
    void marksAProductAsSoldOut() {
        var response = mvc.post()
                .uri(PRODUCTS + "/10/mark-sold-out")
                .with(sessionOf("OWNER", 7L))
                .with(csrf());

        assertThat(response).hasStatus(HttpStatus.NO_CONTENT);
        verify(markProductSoldOut).execute(7L, 10L);
    }

    @Test
    void marksAProductAsAvailable() {
        var response = mvc.post()
                .uri(PRODUCTS + "/10/mark-available")
                .with(sessionOf("OWNER", 7L))
                .with(csrf());

        assertThat(response).hasStatus(HttpStatus.NO_CONTENT);
        verify(markProductAvailable).execute(7L, 10L);
    }

    @Test
    void refusesToMarkAProductOfAnotherRestaurant() {
        doThrow(new CatalogNotOwnerException()).when(markProductSoldOut).execute(7L, 10L);

        var response = mvc.post()
                .uri(PRODUCTS + "/10/mark-sold-out")
                .with(sessionOf("OWNER", 7L))
                .with(csrf());

        assertThat(response)
                .hasStatus(HttpStatus.FORBIDDEN)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("catalog.not_owner");
    }

    @Test
    void returnsNotFoundWhenDeletingAMissingProduct() {
        doThrow(new ProductNotFoundException()).when(deleteProduct).execute(7L, 99L);

        var response =
                mvc.delete().uri(PRODUCTS + "/99").with(sessionOf("OWNER", 7L)).with(csrf());

        assertThat(response)
                .hasStatus(HttpStatus.NOT_FOUND)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("catalog.product_not_found");
    }

    @ParameterizedTest
    @ValueSource(strings = {"/silpancho/mark-sold-out", "/silpancho/mark-available"})
    void rejectsAnIdThatIsNotANumber(String path) {
        var response =
                mvc.post().uri(PRODUCTS + path).with(sessionOf("OWNER", 7L)).with(csrf());

        assertThat(response)
                .hasStatus(HttpStatus.BAD_REQUEST)
                .bodyJson()
                .extractingPath("$.errors[0].field")
                .isEqualTo("id");
        verifyNoInteractions(markProductSoldOut, markProductAvailable);
    }

    @ParameterizedTest
    @MethodSource("changes")
    void rejectsAChangeWithoutSession(HttpMethod method, String path) {
        var response = withBody(mvc.method(method).uri(PRODUCTS + path).with(csrf()));

        assertThat(response)
                .hasStatus(HttpStatus.UNAUTHORIZED)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("unauthenticated");
        verifyNoUseCaseRan();
    }

    @ParameterizedTest
    @MethodSource("changesFromOtherRoles")
    void rejectsAChangeFromAnotherRole(HttpMethod method, String path, String role) {
        var response = withBody(mvc.method(method)
                .uri(PRODUCTS + path)
                .with(sessionOf(role, 3L))
                .with(csrf()));

        assertThat(response)
                .hasStatus(HttpStatus.FORBIDDEN)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("access_denied");
        verifyNoUseCaseRan();
    }

    @ParameterizedTest
    @MethodSource("changes")
    void rejectsAChangeWithoutCsrfToken(HttpMethod method, String path) {
        var response = withBody(mvc.method(method).uri(PRODUCTS + path).with(sessionOf("OWNER", 7L)));

        assertThat(response)
                .hasStatus(HttpStatus.FORBIDDEN)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("csrf_invalid");
        verifyNoUseCaseRan();
    }

    static Stream<Arguments> invalidProducts() {
        return Stream.of(
                Arguments.of(product("null", quoted("Silpancho"), "null", "45"), "categoryId"),
                Arguments.of(product("3", quoted(""), "null", "45"), "name"),
                Arguments.of(product("3", quoted("   "), "null", "45"), "name"),
                Arguments.of(product("3", "null", "null", "45"), "name"),
                Arguments.of(product("3", quoted("a".repeat(121)), "null", "45"), "name"),
                Arguments.of(product("3", quoted("Silpancho"), quoted("a".repeat(301)), "45"), "description"),
                Arguments.of(product("3", quoted("Silpancho"), "null", "null"), "price"),
                Arguments.of(product("3", quoted("Silpancho"), "null", "0"), "price"),
                Arguments.of(product("3", quoted("Silpancho"), "null", "-5"), "price"),
                Arguments.of(product("3", quoted("Silpancho"), "null", "45.555"), "price"),
                Arguments.of(product("3", quoted("Silpancho"), "null", "10000000000"), "price"));
    }

    static Stream<Arguments> changes() {
        return Stream.of(
                Arguments.of(HttpMethod.POST, ""),
                Arguments.of(HttpMethod.PUT, "/10"),
                Arguments.of(HttpMethod.DELETE, "/10"),
                Arguments.of(HttpMethod.POST, "/10/mark-sold-out"),
                Arguments.of(HttpMethod.POST, "/10/mark-available"));
    }

    static Stream<Arguments> changesFromOtherRoles() {
        return changes()
                .flatMap(change -> Stream.of("CUSTOMER", "ADMIN")
                        .map(role -> Arguments.of(change.get()[0], change.get()[1], role)));
    }

    private void verifyNoUseCaseRan() {
        verifyNoInteractions(createProduct, editProduct, deleteProduct, markProductSoldOut, markProductAvailable);
    }

    private static MockMvcRequestBuilder asOwner(MockMvcRequestBuilder request) {
        return request.with(sessionOf("OWNER", 7L)).with(csrf()).contentType(MediaType.APPLICATION_JSON);
    }

    private static MockMvcRequestBuilder withBody(MockMvcRequestBuilder request) {
        return request.contentType(MediaType.APPLICATION_JSON).content(SILPANCHO);
    }

    private static String product(String categoryId, String name, String description, String price) {
        return """
                {"categoryId": %s, "name": %s, "description": %s, "price": %s}
                """.formatted(categoryId, name, description, price);
    }

    private static String quoted(String value) {
        return '"' + value + '"';
    }

    private static Product silpancho(boolean available) {
        return new Product(10L, 4L, 3L, "Silpancho", "Con arroz y huevo", new BigDecimal("45.50"), available, null);
    }
}
