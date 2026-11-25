package com.nur.pedidos.order;

import static com.nur.pedidos.shared.infrastructure.security.TestSessions.sessionOf;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;

import com.nur.pedidos.TestcontainersConfiguration;
import com.nur.pedidos.order.application.AcceptOrderUseCase;
import com.nur.pedidos.order.application.CancelOrderUseCase;
import com.nur.pedidos.order.domain.model.Order;
import com.nur.pedidos.order.domain.model.OrderItem;
import com.nur.pedidos.order.domain.model.OrderStatus;
import com.nur.pedidos.order.domain.port.OrderRepository;
import com.nur.pedidos.restaurant.application.RegisterRestaurantCommand;
import com.nur.pedidos.restaurant.application.RegisterRestaurantUseCase;
import com.nur.pedidos.restaurant.domain.model.RestaurantCategory;
import java.io.UnsupportedEncodingException;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.support.TransactionTemplate;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class OrderLiveUpdatesTest {

    private static final Instant PLACED_AT = Instant.parse("2026-11-08T15:00:00Z");
    private static final Long CUSTOMER = 7_101L;
    private static final Long OWNER = 9_101L;
    private static final Long OWNER_OF_A_ROLLBACK = 9_102L;

    @Autowired
    private MockMvc mvc;

    @Autowired
    private RegisterRestaurantUseCase registerRestaurant;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private AcceptOrderUseCase acceptOrder;

    @Autowired
    private CancelOrderUseCase cancelOrder;

    @Autowired
    private TransactionTemplate transactionTemplate;

    @Test
    void theOwnerAndTheCustomerHearAChangeOnlyOnceItIsCommitted() throws Exception {
        Long orderId = orderRepository.save(pendingOrderAt(restaurantOf(OWNER))).getId();
        MockHttpServletResponse ownerStream = open("/api/v1/restaurants/mine/orders/events", "OWNER", OWNER);
        MockHttpServletResponse customerStream = open("/api/v1/orders/events", "CUSTOMER", CUSTOMER);
        String accepted = "data:{\"orderId\":" + orderId + ",\"status\":\"ACCEPTED\"}";

        transactionTemplate.executeWithoutResult(status -> {
            acceptOrder.execute(OWNER, orderId);
            assertThat(contentOf(ownerStream)).doesNotContain(accepted);
        });

        assertThat(contentOf(ownerStream)).contains(accepted);
        assertThat(contentOf(customerStream)).contains(accepted);
    }

    @Test
    void nobodyHearsAChangeThatWasRolledBack() throws Exception {
        Long orderId = orderRepository
                .save(pendingOrderAt(restaurantOf(OWNER_OF_A_ROLLBACK)))
                .getId();
        MockHttpServletResponse ownerStream =
                open("/api/v1/restaurants/mine/orders/events", "OWNER", OWNER_OF_A_ROLLBACK);

        transactionTemplate.executeWithoutResult(status -> {
            cancelOrder.execute(CUSTOMER, orderId);
            status.setRollbackOnly();
        });

        assertThat(contentOf(ownerStream)).doesNotContain("\"orderId\":" + orderId);
    }

    private MockHttpServletResponse open(String uri, String role, Long accountId) throws Exception {
        return mvc.perform(get(uri).accept(MediaType.TEXT_EVENT_STREAM).with(sessionOf(role, accountId)))
                .andExpect(request().asyncStarted())
                .andReturn()
                .getResponse();
    }

    private static String contentOf(MockHttpServletResponse response) {
        try {
            return response.getContentAsString();
        } catch (UnsupportedEncodingException e) {
            throw new IllegalStateException(e);
        }
    }

    private Long restaurantOf(Long ownerId) {
        return registerRestaurant
                .execute(new RegisterRestaurantCommand(
                        ownerId, "La Casona", null, "Calle Sucre 245", RestaurantCategory.TRADITIONAL, null))
                .getId();
    }

    private static Order pendingOrderAt(Long restaurantId) {
        return new Order(
                null,
                CUSTOMER,
                restaurantId,
                "La Casona",
                OrderStatus.PLACED,
                new BigDecimal("45.00"),
                PLACED_AT,
                PLACED_AT,
                List.of(new OrderItem(null, 10L, "Silpancho", new BigDecimal("45.00"), 1)));
    }
}
