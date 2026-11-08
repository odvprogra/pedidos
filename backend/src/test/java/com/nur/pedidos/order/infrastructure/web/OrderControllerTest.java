package com.nur.pedidos.order.infrastructure.web;

import static com.nur.pedidos.shared.infrastructure.security.TestSessions.sessionOf;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

import com.nur.pedidos.order.application.PlaceOrderCommand;
import com.nur.pedidos.order.application.PlaceOrderUseCase;
import com.nur.pedidos.order.domain.exception.ProductUnavailableException;
import com.nur.pedidos.order.domain.exception.RestaurantUnavailableException;
import com.nur.pedidos.order.domain.model.Order;
import com.nur.pedidos.order.domain.model.OrderItem;
import com.nur.pedidos.order.domain.model.OrderLine;
import com.nur.pedidos.order.domain.model.OrderStatus;
import com.nur.pedidos.shared.domain.exception.DomainException;
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
                Arguments.of(new ProductUnavailableException(), "order.product_unavailable"));
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
