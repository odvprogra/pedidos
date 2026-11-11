package com.nur.pedidos.order.infrastructure.web;

import static com.nur.pedidos.shared.infrastructure.security.TestSessions.sessionOf;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

import com.nur.pedidos.order.application.AcceptOrderUseCase;
import com.nur.pedidos.order.application.ListRestaurantOrdersUseCase;
import com.nur.pedidos.order.application.MarkOrderPickedUpUseCase;
import com.nur.pedidos.order.application.MarkOrderReadyUseCase;
import com.nur.pedidos.order.application.RejectOrderUseCase;
import com.nur.pedidos.order.domain.exception.InvalidOrderTransitionException;
import com.nur.pedidos.order.domain.exception.OrderNotFoundException;
import com.nur.pedidos.order.domain.exception.OrderNotOwnerException;
import com.nur.pedidos.order.domain.model.Order;
import com.nur.pedidos.order.domain.model.OrderItem;
import com.nur.pedidos.order.domain.model.OrderStatus;
import com.nur.pedidos.restaurant.domain.exception.RestaurantNotFoundException;
import com.nur.pedidos.shared.domain.exception.DomainException;
import com.nur.pedidos.shared.domain.model.PageResult;
import com.nur.pedidos.shared.infrastructure.security.SecurityConfig;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Set;
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
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

@WebMvcTest(RestaurantOrderController.class)
@Import(SecurityConfig.class)
class RestaurantOrderControllerTest {

    private static final String ORDERS = "/api/v1/restaurants/mine/orders";

    @Autowired
    private MockMvcTester mvc;

    @MockitoBean
    private ListRestaurantOrdersUseCase listRestaurantOrders;

    @MockitoBean
    private AcceptOrderUseCase acceptOrder;

    @MockitoBean
    private RejectOrderUseCase rejectOrder;

    @MockitoBean
    private MarkOrderReadyUseCase markOrderReady;

    @MockitoBean
    private MarkOrderPickedUpUseCase markOrderPickedUp;

    @Test
    void listsTheOrdersOfTheRestaurantOfTheOwnerInSession() {
        when(listRestaurantOrders.execute(3L, Set.of(), 0, 20))
                .thenReturn(new PageResult<>(List.of(order(OrderStatus.PLACED)), 0, 20, 1));

        var response = mvc.get().uri(ORDERS).with(sessionOf("OWNER", 3L));

        assertThat(response).hasStatusOk().bodyJson().isStrictlyEqualTo("""
                {
                  "items": [
                    {
                      "id": 42,
                      "restaurantId": 4,
                      "restaurantName": "La Casona",
                      "status": "PLACED",
                      "total": 90.00,
                      "placedAt": "2026-11-08T15:00:00Z",
                      "updatedAt": "2026-11-08T15:20:00Z",
                      "items": [
                        {
                          "productId": 10,
                          "productName": "Silpancho",
                          "unitPrice": 45.00,
                          "quantity": 2,
                          "subtotal": 90.00
                        }
                      ]
                    }
                  ],
                  "page": 0,
                  "size": 20,
                  "totalItems": 1,
                  "totalPages": 1
                }
                """);
    }

    @Test
    void filtersByTheRequestedStatusesAndPage() {
        Set<OrderStatus> inProgress = Set.of(OrderStatus.PLACED, OrderStatus.ACCEPTED, OrderStatus.READY);
        when(listRestaurantOrders.execute(3L, inProgress, 1, 10)).thenReturn(new PageResult<>(List.of(), 1, 10, 4));

        var response = mvc.get()
                .uri(ORDERS + "?status=PLACED&status=ACCEPTED&status=READY&page=1&size=10")
                .with(sessionOf("OWNER", 3L));

        assertThat(response)
                .hasStatusOk()
                .bodyJson()
                .extractingPath("$.totalItems")
                .isEqualTo(4);
        verify(listRestaurantOrders).execute(3L, inProgress, 1, 10);
    }

    @ParameterizedTest
    @MethodSource("queriesThatBreakTheFormat")
    void rejectsAQueryThatBreaksTheFormat(String query, String field) {
        var response = mvc.get().uri(ORDERS + "?" + query).with(sessionOf("OWNER", 3L));

        assertThat(response).hasStatus(HttpStatus.BAD_REQUEST).bodyJson().satisfies(json -> {
            assertThat(json).extractingPath("$.code").isEqualTo("validation_failed");
            assertThat(json).extractingPath("$.errors[0].field").isEqualTo(field);
        });
        verifyNoInteractions(listRestaurantOrders);
    }

    @Test
    void answersAnOwnerWithoutRestaurantWithNotFound() {
        when(listRestaurantOrders.execute(3L, Set.of(), 0, 20)).thenThrow(new RestaurantNotFoundException());

        var response = mvc.get().uri(ORDERS).with(sessionOf("OWNER", 3L));

        assertThat(response)
                .hasStatus(HttpStatus.NOT_FOUND)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("restaurant.not_found");
    }

    @Test
    void acceptsAnOrderOfTheRestaurant() {
        when(acceptOrder.execute(3L, 42L)).thenReturn(order(OrderStatus.ACCEPTED));

        var response = asOwner(HttpMethod.POST, "/42/accept");

        assertThat(response).hasStatusOk().bodyJson().extractingPath("$.status").isEqualTo("ACCEPTED");
        verify(acceptOrder).execute(3L, 42L);
    }

    @Test
    void rejectsAnOrderOfTheRestaurant() {
        when(rejectOrder.execute(3L, 42L)).thenReturn(order(OrderStatus.REJECTED));

        var response = asOwner(HttpMethod.POST, "/42/reject");

        assertThat(response).hasStatusOk().bodyJson().extractingPath("$.status").isEqualTo("REJECTED");
        verify(rejectOrder).execute(3L, 42L);
    }

    @Test
    void marksAnOrderOfTheRestaurantAsReady() {
        when(markOrderReady.execute(3L, 42L)).thenReturn(order(OrderStatus.READY));

        var response = asOwner(HttpMethod.POST, "/42/mark-ready");

        assertThat(response).hasStatusOk().bodyJson().extractingPath("$.status").isEqualTo("READY");
        verify(markOrderReady).execute(3L, 42L);
    }

    @Test
    void marksAnOrderOfTheRestaurantAsPickedUp() {
        when(markOrderPickedUp.execute(3L, 42L)).thenReturn(order(OrderStatus.PICKED_UP));

        var response = asOwner(HttpMethod.POST, "/42/mark-picked-up");

        assertThat(response).hasStatusOk().bodyJson().satisfies(json -> {
            assertThat(json).extractingPath("$.status").isEqualTo("PICKED_UP");
            assertThat(json).extractingPath("$.updatedAt").isEqualTo("2026-11-08T15:20:00Z");
        });
        verify(markOrderPickedUp).execute(3L, 42L);
    }

    @ParameterizedTest
    @MethodSource("refusedActions")
    void answersAnActionThatCannotBeDoneWithItsCode(DomainException error, HttpStatus status, String code) {
        when(acceptOrder.execute(anyLong(), anyLong())).thenThrow(error);

        var response = asOwner(HttpMethod.POST, "/42/accept");

        assertThat(response)
                .hasStatus(status)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo(code);
    }

    @ParameterizedTest
    @ValueSource(strings = {"/abc/accept", "/abc/reject", "/abc/mark-ready", "/abc/mark-picked-up"})
    void rejectsAnOrderIdThatIsNotANumber(String path) {
        var response = asOwner(HttpMethod.POST, path);

        assertThat(response).hasStatus(HttpStatus.BAD_REQUEST).bodyJson().satisfies(json -> {
            assertThat(json).extractingPath("$.code").isEqualTo("validation_failed");
            assertThat(json).extractingPath("$.errors[0].field").isEqualTo("id");
        });
        verifyNoInteractions(acceptOrder, rejectOrder, markOrderReady, markOrderPickedUp);
    }

    @ParameterizedTest
    @MethodSource("ownerEndpoints")
    void rejectsTheOrdersOfTheRestaurantWithoutSession(HttpMethod method, String path) {
        var response = mvc.method(method).uri(ORDERS + path).with(csrf());

        assertThat(response)
                .hasStatus(HttpStatus.UNAUTHORIZED)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("unauthenticated");
        verifyNoInteractions(listRestaurantOrders, acceptOrder, rejectOrder, markOrderReady, markOrderPickedUp);
    }

    @ParameterizedTest
    @MethodSource("ownerEndpointsForOtherRoles")
    void rejectsTheOrdersOfTheRestaurantForAnotherRole(HttpMethod method, String path, String role) {
        var response =
                mvc.method(method).uri(ORDERS + path).with(sessionOf(role, 7L)).with(csrf());

        assertThat(response)
                .hasStatus(HttpStatus.FORBIDDEN)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("access_denied");
        verifyNoInteractions(listRestaurantOrders, acceptOrder, rejectOrder, markOrderReady, markOrderPickedUp);
    }

    @ParameterizedTest
    @ValueSource(strings = {"/42/accept", "/42/reject", "/42/mark-ready", "/42/mark-picked-up"})
    void rejectsAnActionWithoutCsrfToken(String path) {
        var response = mvc.post().uri(ORDERS + path).with(sessionOf("OWNER", 3L));

        assertThat(response)
                .hasStatus(HttpStatus.FORBIDDEN)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("csrf_invalid");
        verifyNoInteractions(acceptOrder, rejectOrder, markOrderReady, markOrderPickedUp);
    }

    static Stream<Arguments> queriesThatBreakTheFormat() {
        return Stream.of(
                Arguments.of("status=DELIVERED", "status"),
                Arguments.of("page=-1", "page"),
                Arguments.of("size=101", "size"),
                Arguments.of("size=diez", "size"));
    }

    static Stream<Arguments> refusedActions() {
        return Stream.of(
                Arguments.of(new RestaurantNotFoundException(), HttpStatus.NOT_FOUND, "restaurant.not_found"),
                Arguments.of(new OrderNotFoundException(), HttpStatus.NOT_FOUND, "order.not_found"),
                Arguments.of(new OrderNotOwnerException(), HttpStatus.FORBIDDEN, "order.not_owner"),
                Arguments.of(new InvalidOrderTransitionException(), HttpStatus.CONFLICT, "order.invalid_transition"));
    }

    static Stream<Arguments> ownerEndpoints() {
        return Stream.of(
                Arguments.of(HttpMethod.GET, ""),
                Arguments.of(HttpMethod.POST, "/42/accept"),
                Arguments.of(HttpMethod.POST, "/42/reject"),
                Arguments.of(HttpMethod.POST, "/42/mark-ready"),
                Arguments.of(HttpMethod.POST, "/42/mark-picked-up"));
    }

    static Stream<Arguments> ownerEndpointsForOtherRoles() {
        return ownerEndpoints()
                .flatMap(endpoint -> Stream.of("CUSTOMER", "ADMIN")
                        .map(role -> Arguments.of(endpoint.get()[0], endpoint.get()[1], role)));
    }

    private MvcTestResult asOwner(HttpMethod method, String path) {
        return mvc.method(method)
                .uri(ORDERS + path)
                .with(sessionOf("OWNER", 3L))
                .with(csrf())
                .exchange();
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
}
