package com.nur.pedidos.order.infrastructure.web;

import static com.nur.pedidos.shared.infrastructure.security.TestSessions.sessionOf;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.nur.pedidos.order.application.ListAllOrdersUseCase;
import com.nur.pedidos.order.domain.model.Order;
import com.nur.pedidos.order.domain.model.OrderItem;
import com.nur.pedidos.order.domain.model.OrderStatus;
import com.nur.pedidos.shared.domain.model.PageResult;
import com.nur.pedidos.shared.infrastructure.security.SecurityConfig;
import java.math.BigDecimal;
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

@WebMvcTest(AdminOrderController.class)
@Import(SecurityConfig.class)
class AdminOrderControllerTest {

    private static final String LIST = "/api/v1/admin/orders";

    @Autowired
    private MockMvcTester mvc;

    @MockitoBean
    private ListAllOrdersUseCase listAllOrders;

    @Test
    void listsTheFirstPageOfEveryOrderAsAdmin() {
        when(listAllOrders.execute(0, 20)).thenReturn(new PageResult<>(List.of(order()), 0, 20, 1));

        var response = mvc.get().uri(LIST).with(sessionOf("ADMIN", 1L));

        assertThat(response).hasStatus(HttpStatus.OK).bodyJson().isStrictlyEqualTo("""
                {
                  "items": [
                    {
                      "id": 42,
                      "restaurantId": 4,
                      "restaurantName": "La Casona",
                      "status": "IN_PREPARATION",
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

    @ParameterizedTest
    @CsvSource({"0, 1", "2, 20", "1000000, 100"})
    void listsTheRequestedPageAndSize(int page, int size) {
        when(listAllOrders.execute(page, size)).thenReturn(new PageResult<>(List.of(), page, size, 45));

        var response = mvc.get().uri(LIST + "?page=" + page + "&size=" + size).with(sessionOf("ADMIN", 1L));

        assertThat(response).hasStatus(HttpStatus.OK).bodyJson().satisfies(json -> {
            assertThat(json).extractingPath("$.page").isEqualTo(page);
            assertThat(json).extractingPath("$.size").isEqualTo(size);
            assertThat(json).extractingPath("$.totalItems").isEqualTo(45);
        });
        verify(listAllOrders).execute(page, size);
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
        verifyNoInteractions(listAllOrders);
    }

    @Test
    void rejectsTheListWithoutSession() {
        assertThat(mvc.get().uri(LIST))
                .hasStatus(HttpStatus.UNAUTHORIZED)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("unauthenticated");
        verifyNoInteractions(listAllOrders);
    }

    @ParameterizedTest
    @ValueSource(strings = {"CUSTOMER", "OWNER"})
    void rejectsTheListForAnotherRole(String role) {
        assertThat(mvc.get().uri(LIST).with(sessionOf(role, 7L)))
                .hasStatus(HttpStatus.FORBIDDEN)
                .bodyJson()
                .extractingPath("$.code")
                .isEqualTo("access_denied");
        verifyNoInteractions(listAllOrders);
    }

    private static Order order() {
        return new Order(
                42L,
                7L,
                4L,
                "La Casona",
                OrderStatus.IN_PREPARATION,
                new BigDecimal("90.00"),
                Instant.parse("2026-11-08T15:00:00Z"),
                Instant.parse("2026-11-08T15:20:00Z"),
                List.of(new OrderItem(1L, 10L, "Silpancho", new BigDecimal("45.00"), 2)));
    }
}
