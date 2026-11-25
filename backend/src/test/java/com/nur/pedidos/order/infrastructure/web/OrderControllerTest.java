package com.nur.pedidos.order.infrastructure.web;

import static com.nur.pedidos.shared.infrastructure.security.TestSessions.sessionOf;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

import com.nur.pedidos.order.application.CancelOrderUseCase;
import com.nur.pedidos.order.application.GetCustomerOrderUseCase;
import com.nur.pedidos.order.application.ListCustomerOrdersUseCase;
import com.nur.pedidos.order.application.PlaceOrderCommand;
import com.nur.pedidos.order.application.PlaceOrderUseCase;
import com.nur.pedidos.order.domain.exception.InvalidOrderTransitionException;
import com.nur.pedidos.order.domain.exception.OrderNotFoundException;
import com.nur.pedidos.order.domain.exception.OrderNotOwnerException;
import com.nur.pedidos.order.domain.exception.RestaurantUnavailableException;
import com.nur.pedidos.order.domain.model.Order;
import com.nur.pedidos.order.domain.model.OrderItem;
import com.nur.pedidos.order.domain.model.OrderLine;
import com.nur.pedidos.order.domain.model.OrderStatus;
import com.nur.pedidos.shared.domain.exception.DomainException;
import com.nur.pedidos.shared.domain.model.PageResult;
import com.nur.pedidos.shared.infrastructure.security.SecurityConfig;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
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

@WebMvcTest(OrderController.class)
@Import(SecurityConfig.class)
class OrderControllerTest {

    private static final String ORDERS = "/api/v1/orders";
    private static final String TWO_SILPANCHOS_AND_A_LEMONADE = """
            {"restaurantId": 4, "items": [{"productId": 10, "quantity": 2}, {"productId": 12, "quantity": 1}]}
            """;

    @Autowired
    private MockMvcTester mvc;

    @MockitoBean
    private PlaceOrderUseCase placeOrder;

    @MockitoBean
    private ListCustomerOrdersUseCase listCustomerOrders;

    @MockitoBean
    private GetCustomerOrderUseCase getCustomerOrder;

    @MockitoBean
    private CancelOrderUseCase cancelOrder;

    @MockitoBean
    private OrderChangeStreams orderChangeStreams;

    @Test
    void placesAnOrderForTheCustomerInSession() {
        when(placeOrder.execute(any())).thenReturn(placedOrder());

        var response = asCustomer(mvc.post().uri(ORDERS)).content(TWO_SILPANCHOS_AND_A_LEMONADE);

        assertThat(response)
                .hasStatus(HttpStatus.CREATED)
                .hasHeader("Location", "/api/v1/orders/42")
                .bodyJson()
                .isStrictlyEqualTo("""
                        {
                          "id": 42,
                          "restaurantId": 4,
                          "restaurantName": "La Casona",
                          "status": "PLACED",
                          "total": 100.50,
                          "placedAt": "2026-11-08T15:00:00Z",
                          "updatedAt": "2026-11-08T15:00:00Z",
                          "items": [
                            {
                              "productId": 10,
                              "productName": "Silpancho",
                              "unitPrice": 45.00,
                              "quantity": 2,
                              "subtotal": 90.00
                            },
                            {
                              "productId": 12,
                              "productName": "Limonada",
                              "unitPrice": 10.50,
                              "quantity": 1,
                              "subtotal": 10.50
                            }
                          ]
                        }
                        """);
        verify(placeOrder)
                .execute(new PlaceOrderCommand(7L, 4L, List.of(new OrderLine(10L, 2), new OrderLine(12L, 1))));
    }

    @Test
    void ignoresThePricesAndTheCustomerSentInTheBody() {
        when(placeOrder.execute(any())).thenReturn(placedOrder());

        var response = asCustomer(mvc.post().uri(ORDERS)).content("""
                {
                  "restaurantId": 4,
                  "customerId": 99,
                  "total": 1,
                  "items": [{"productId": 10, "quantity": 2, "unitPrice": 0.01}]
                }
                """);

        assertThat(response).hasStatus(HttpStatus.CREATED);
        verify(placeOrder).execute(new PlaceOrderCommand(7L, 4L, List.of(new OrderLine(10L, 2))));
    }

    @ParameterizedTest
    @MethodSource("ordersLeftToTheBusinessRules")
    void leavesTheEmptyOrderAndTheQuantitiesToTheBusinessRules(String body, List<OrderLine> lines) {
        when(placeOrder.execute(any())).thenReturn(placedOrder());

        var response = asCustomer(mvc.post().uri(ORDERS)).content(body);

        assertThat(response).hasStatus(HttpStatus.CREATED);
        verify(placeOrder).execute(new PlaceOrderCommand(7L, 4L, lines));
    }

    @ParameterizedTest
    @MethodSource("rejectedOrders")
    void answersEachBrokenRuleWithItsCode(DomainException rule, String code) {
        when(placeOrder.execute(any())).thenThrow(rule);

        var response = asCustomer(mvc.post().uri(ORDERS)).content(TWO_SILPANCHOS_AND_A_LEMONADE);

        assertThat(response)
                .hasStatus(HttpStatus.UNPROCESSABLE_CONTENT)
                .bodyJson()
                .satisfies(json -> {
                    assertThat(json).extractingPath("$.code").isEqualTo(code);
                    assertThat(json).extractingPath("$.detail").isEqualTo(rule.getMessage());
                });
    }

    @ParameterizedTest
    @MethodSource("ordersThatBreakTheFormat")
    void rejectsAnOrderThatBreaksTheFormat(String body, String field) {
        var response = asCustomer(mvc.post().uri(ORDERS)).content(body);

        assertThat(response).hasStatus(HttpStatus.BAD_REQUEST).bodyJson().satisfies(json -> {
            assertThat(json).extractingPath("$.code").isEqualTo("validation_failed");
            assertThat(json).extractingPath("$.errors[0].field").isEqualTo(field);
        });
        verifyNoInteractions(placeOrder);
    }

    @ParameterizedTest
    @ValueSource(
            strings = {
                "{\"restaurantId\": 4, \"items\": [{\"productId\": 10, \"quantity\": \"dos\"}]}",
                "{\"restaurantId\": \"La Casona\", \"items\": []}",
                "no es json"
            })
    void rejectsABodyThatCannotBeRead(String body) {
        var response = asCustomer(mvc.post().uri(ORDERS)).content(body);

        assertThat(response)
                .hasStatus(HttpStatus.BAD_REQUEST)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("validation_failed");
        verifyNoInteractions(placeOrder);
    }

    @Test
    void rejectsAnOrderWithoutSession() {
        var response = mvc.post()
                .uri(ORDERS)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(TWO_SILPANCHOS_AND_A_LEMONADE);

        assertThat(response)
                .hasStatus(HttpStatus.UNAUTHORIZED)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("unauthenticated");
        verifyNoInteractions(placeOrder);
    }

    @ParameterizedTest
    @ValueSource(strings = {"OWNER", "ADMIN"})
    void rejectsAnOrderFromAnotherRole(String role) {
        var response = mvc.post()
                .uri(ORDERS)
                .with(sessionOf(role, 3L))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(TWO_SILPANCHOS_AND_A_LEMONADE);

        assertThat(response)
                .hasStatus(HttpStatus.FORBIDDEN)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("access_denied");
        verifyNoInteractions(placeOrder);
    }

    @Test
    void rejectsAnOrderWithoutCsrfToken() {
        var response = mvc.post()
                .uri(ORDERS)
                .with(sessionOf("CUSTOMER", 7L))
                .contentType(MediaType.APPLICATION_JSON)
                .content(TWO_SILPANCHOS_AND_A_LEMONADE);

        assertThat(response)
                .hasStatus(HttpStatus.FORBIDDEN)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("csrf_invalid");
        verifyNoInteractions(placeOrder);
    }

    @Test
    void listsTheOrdersOfTheCustomerInSession() {
        when(listCustomerOrders.execute(7L, 0, 20))
                .thenReturn(new PageResult<>(List.of(order(OrderStatus.PLACED)), 0, 20, 1));

        var response = mvc.get().uri(ORDERS).with(sessionOf("CUSTOMER", 7L));

        assertThat(response).hasStatusOk().bodyJson().satisfies(json -> {
            assertThat(json).extractingPath("$.items[0].id").isEqualTo(42);
            assertThat(json).extractingPath("$.items[0].status").isEqualTo("PLACED");
            assertThat(json).extractingPath("$.items[0].items[0].productName").isEqualTo("Silpancho");
            assertThat(json).extractingPath("$.page").isEqualTo(0);
            assertThat(json).extractingPath("$.size").isEqualTo(20);
            assertThat(json).extractingPath("$.totalItems").isEqualTo(1);
            assertThat(json).extractingPath("$.totalPages").isEqualTo(1);
        });
    }

    @Test
    void asksForTheRequestedPage() {
        when(listCustomerOrders.execute(7L, 2, 10)).thenReturn(new PageResult<>(List.of(), 2, 10, 3));

        var response = mvc.get().uri(ORDERS + "?page=2&size=10").with(sessionOf("CUSTOMER", 7L));

        assertThat(response).hasStatusOk().bodyJson().isStrictlyEqualTo("""
                {"items": [], "page": 2, "size": 10, "totalItems": 3, "totalPages": 1}
                """);
    }

    @ParameterizedTest
    @MethodSource("pagesOutsideTheLimits")
    void rejectsAPageOutsideTheLimits(String query, String field) {
        var response = mvc.get().uri(ORDERS + "?" + query).with(sessionOf("CUSTOMER", 7L));

        assertThat(response).hasStatus(HttpStatus.BAD_REQUEST).bodyJson().satisfies(json -> {
            assertThat(json).extractingPath("$.code").isEqualTo("validation_failed");
            assertThat(json).extractingPath("$.errors[0].field").isEqualTo(field);
        });
        verifyNoInteractions(listCustomerOrders);
    }

    @Test
    void givesTheCustomerOneOfTheirOrders() {
        when(getCustomerOrder.execute(7L, 42L)).thenReturn(order(OrderStatus.ACCEPTED));

        var response = mvc.get().uri(ORDERS + "/42").with(sessionOf("CUSTOMER", 7L));

        assertThat(response).hasStatusOk().bodyJson().satisfies(json -> {
            assertThat(json).extractingPath("$.id").isEqualTo(42);
            assertThat(json).extractingPath("$.status").isEqualTo("ACCEPTED");
            assertThat(json).extractingPath("$.updatedAt").isEqualTo("2026-11-08T15:20:00Z");
        });
    }

    @Test
    void cancelsAnOrderOfTheCustomerInSession() {
        when(cancelOrder.execute(7L, 42L)).thenReturn(order(OrderStatus.CANCELLED));

        var response = mvc.post()
                .uri(ORDERS + "/42/cancel")
                .with(sessionOf("CUSTOMER", 7L))
                .with(csrf());

        assertThat(response).hasStatusOk().bodyJson().satisfies(json -> {
            assertThat(json).extractingPath("$.status").isEqualTo("CANCELLED");
            assertThat(json).extractingPath("$.updatedAt").isEqualTo("2026-11-08T15:20:00Z");
        });
        verify(cancelOrder).execute(7L, 42L);
    }

    @ParameterizedTest
    @MethodSource("refusedOrders")
    void answersAnOrderThatCannotBeSeenWithItsCode(DomainException error, HttpStatus status, String code) {
        when(getCustomerOrder.execute(anyLong(), anyLong())).thenThrow(error);

        var response = mvc.get().uri(ORDERS + "/42").with(sessionOf("CUSTOMER", 7L));

        assertThat(response)
                .hasStatus(status)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo(code);
    }

    @ParameterizedTest
    @MethodSource("refusedCancellations")
    void answersACancellationThatCannotBeDoneWithItsCode(DomainException error, HttpStatus status, String code) {
        when(cancelOrder.execute(anyLong(), anyLong())).thenThrow(error);

        var response = mvc.post()
                .uri(ORDERS + "/42/cancel")
                .with(sessionOf("CUSTOMER", 7L))
                .with(csrf());

        assertThat(response)
                .hasStatus(status)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo(code);
    }

    @ParameterizedTest
    @MethodSource("endpointsWithAnId")
    void rejectsAnOrderIdThatIsNotANumber(HttpMethod method, String path) {
        var response = mvc.method(method)
                .uri(ORDERS + path.replace("42", "abc"))
                .with(sessionOf("CUSTOMER", 7L))
                .with(csrf());

        assertThat(response).hasStatus(HttpStatus.BAD_REQUEST).bodyJson().satisfies(json -> {
            assertThat(json).extractingPath("$.code").isEqualTo("validation_failed");
            assertThat(json).extractingPath("$.errors[0].field").isEqualTo("id");
        });
        verifyNoInteractions(getCustomerOrder, cancelOrder);
    }

    @ParameterizedTest
    @MethodSource("customerEndpoints")
    void rejectsTheHistoryWithoutSession(HttpMethod method, String path) {
        var response = mvc.method(method).uri(ORDERS + path).with(csrf());

        assertThat(response)
                .hasStatus(HttpStatus.UNAUTHORIZED)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("unauthenticated");
        verifyNoInteractions(listCustomerOrders, getCustomerOrder, cancelOrder);
    }

    @ParameterizedTest
    @MethodSource("customerEndpointsForOtherRoles")
    void rejectsTheHistoryForAnotherRole(HttpMethod method, String path, String role) {
        var response =
                mvc.method(method).uri(ORDERS + path).with(sessionOf(role, 3L)).with(csrf());

        assertThat(response)
                .hasStatus(HttpStatus.FORBIDDEN)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("access_denied");
        verifyNoInteractions(listCustomerOrders, getCustomerOrder, cancelOrder);
    }

    @Test
    void rejectsACancellationWithoutCsrfToken() {
        var response = mvc.post().uri(ORDERS + "/42/cancel").with(sessionOf("CUSTOMER", 7L));

        assertThat(response)
                .hasStatus(HttpStatus.FORBIDDEN)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("csrf_invalid");
        verifyNoInteractions(cancelOrder);
    }

    static Stream<Arguments> pagesOutsideTheLimits() {
        return Stream.of(
                Arguments.of("page=-1", "page"),
                Arguments.of("page=1000001", "page"),
                Arguments.of("page=uno", "page"),
                Arguments.of("size=0", "size"),
                Arguments.of("size=101", "size"),
                Arguments.of("size=diez", "size"));
    }

    static Stream<Arguments> refusedOrders() {
        return Stream.of(
                Arguments.of(new OrderNotFoundException(), HttpStatus.NOT_FOUND, "order.not_found"),
                Arguments.of(new OrderNotOwnerException(), HttpStatus.FORBIDDEN, "order.not_owner"));
    }

    static Stream<Arguments> refusedCancellations() {
        return Stream.of(
                Arguments.of(new OrderNotFoundException(), HttpStatus.NOT_FOUND, "order.not_found"),
                Arguments.of(new OrderNotOwnerException(), HttpStatus.FORBIDDEN, "order.not_owner"),
                Arguments.of(new InvalidOrderTransitionException(), HttpStatus.CONFLICT, "order.invalid_transition"));
    }

    static Stream<Arguments> endpointsWithAnId() {
        return Stream.of(Arguments.of(HttpMethod.GET, "/42"), Arguments.of(HttpMethod.POST, "/42/cancel"));
    }

    static Stream<Arguments> customerEndpoints() {
        return Stream.concat(Stream.of(Arguments.of(HttpMethod.GET, "")), endpointsWithAnId());
    }

    static Stream<Arguments> customerEndpointsForOtherRoles() {
        return customerEndpoints()
                .flatMap(endpoint -> Stream.of("OWNER", "ADMIN")
                        .map(role -> Arguments.of(endpoint.get()[0], endpoint.get()[1], role)));
    }

    static Stream<Arguments> rejectedOrders() {
        return Stream.of(
                Arguments.of(new DomainException("order.empty", "El pedido no tiene productos"), "order.empty"),
                Arguments.of(
                        new DomainException("order.invalid_quantity", "La cantidad de cada producto va de 1 a 99"),
                        "order.invalid_quantity"),
                Arguments.of(
                        new DomainException(
                                "order.duplicate_product", "Un producto aparece más de una vez en el pedido"),
                        "order.duplicate_product"),
                Arguments.of(new RestaurantUnavailableException(), "order.restaurant_unavailable"),
                Arguments.of(
                        new DomainException(
                                "order.product_unavailable", "Un producto del pedido ya no está disponible"),
                        "order.product_unavailable"));
    }

    static Stream<Arguments> ordersLeftToTheBusinessRules() {
        return Stream.of(
                Arguments.of("{\"restaurantId\": 4, \"items\": []}", List.of()),
                Arguments.of(
                        "{\"restaurantId\": 4, \"items\": [{\"productId\": 10, \"quantity\": 0}]}",
                        List.of(new OrderLine(10L, 0))),
                Arguments.of(
                        "{\"restaurantId\": 4, \"items\": [{\"productId\": 10, \"quantity\": 100}]}",
                        List.of(new OrderLine(10L, 100))),
                Arguments.of(
                        "{\"restaurantId\": 4, \"items\": [{\"productId\": 10, \"quantity\": 1},"
                                + " {\"productId\": 10, \"quantity\": 2}]}",
                        List.of(new OrderLine(10L, 1), new OrderLine(10L, 2))));
    }

    static Stream<Arguments> ordersThatBreakTheFormat() {
        return Stream.of(
                Arguments.of("{\"items\": [{\"productId\": 10, \"quantity\": 1}]}", "restaurantId"),
                Arguments.of("{\"restaurantId\": 4}", "items"),
                Arguments.of("{\"restaurantId\": 4, \"items\": [null]}", "items[0]"),
                Arguments.of("{\"restaurantId\": 4, \"items\": [{\"quantity\": 1}]}", "items[0].productId"),
                Arguments.of("{\"restaurantId\": 4, \"items\": [{\"productId\": 10}]}", "items[0].quantity"));
    }

    private static MockMvcRequestBuilder asCustomer(MockMvcRequestBuilder request) {
        return request.with(sessionOf("CUSTOMER", 7L)).with(csrf()).contentType(MediaType.APPLICATION_JSON);
    }

    private static Order order(OrderStatus status) {
        return new Order(
                42L,
                7L,
                4L,
                "La Casona",
                status,
                new BigDecimal("90.00"),
                Instant.parse("2026-11-08T15:00:00Z"),
                Instant.parse("2026-11-08T15:20:00Z"),
                List.of(new OrderItem(1L, 10L, "Silpancho", new BigDecimal("45.00"), 2)));
    }

    private static Order placedOrder() {
        Instant placedAt = Instant.parse("2026-11-08T15:00:00Z");
        return new Order(
                42L,
                7L,
                4L,
                "La Casona",
                OrderStatus.PLACED,
                new BigDecimal("100.50"),
                placedAt,
                placedAt,
                List.of(
                        new OrderItem(1L, 10L, "Silpancho", new BigDecimal("45.00"), 2),
                        new OrderItem(2L, 12L, "Limonada", new BigDecimal("10.50"), 1)));
    }
}
