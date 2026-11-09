package com.nur.pedidos.order;

import static java.util.concurrent.TimeUnit.MILLISECONDS;
import static java.util.concurrent.TimeUnit.SECONDS;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nur.pedidos.TestcontainersConfiguration;
import com.nur.pedidos.order.application.AcceptOrderUseCase;
import com.nur.pedidos.order.application.CancelOrderUseCase;
import com.nur.pedidos.order.domain.exception.InvalidOrderTransitionException;
import com.nur.pedidos.order.domain.model.Order;
import com.nur.pedidos.order.domain.model.OrderItem;
import com.nur.pedidos.order.domain.model.OrderStatus;
import com.nur.pedidos.order.domain.port.OrderRepository;
import com.nur.pedidos.restaurant.application.RegisterRestaurantCommand;
import com.nur.pedidos.restaurant.application.RegisterRestaurantUseCase;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeoutException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.support.TransactionTemplate;

@SpringBootTest
@Import(TestcontainersConfiguration.class)
class OrderLockingTest {

    private static final Instant NOW = Instant.parse("2026-11-08T15:00:00Z");
    private static final Long CUSTOMER = 7L;
    private static final Long OWNER = 9_001L;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private CancelOrderUseCase cancelOrder;

    @Autowired
    private AcceptOrderUseCase acceptOrder;

    @Autowired
    private RegisterRestaurantUseCase registerRestaurant;

    @Autowired
    private TransactionTemplate transactionTemplate;

    @Test
    void aCancellationWaitsForTheAcceptanceInProgressAndIsThenRefused() throws Exception {
        Long orderId = orderRepository.save(pendingOrderAt(4L)).getId();
        CountDownLatch locked = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            Future<?> acceptance = executor.submit(() -> transactionTemplate.executeWithoutResult(status -> {
                Order order = orderRepository.findByIdForUpdate(orderId).orElseThrow();
                locked.countDown();
                awaitQuietly(release);
                order.accept(NOW);
                orderRepository.save(order);
            }));
            assertThat(locked.await(5, SECONDS)).isTrue();
            Future<Order> cancellation = executor.submit(() -> cancelOrder.execute(CUSTOMER, orderId));

            assertThatThrownBy(() -> cancellation.get(500, MILLISECONDS)).isInstanceOf(TimeoutException.class);
            release.countDown();
            acceptance.get(5, SECONDS);

            assertThatThrownBy(() -> cancellation.get(5, SECONDS))
                    .hasCauseInstanceOf(InvalidOrderTransitionException.class);
            assertThat(statusOf(orderId)).isEqualTo(OrderStatus.ACCEPTED);
        } finally {
            release.countDown();
            executor.shutdownNow();
        }
    }

    @Test
    void anAcceptanceWaitsForTheCancellationInProgressAndIsThenRefused() throws Exception {
        Long restaurantId = registerRestaurant
                .execute(new RegisterRestaurantCommand(OWNER, "La Casona", null, "Calle Sucre 245"))
                .getId();
        Long orderId = orderRepository.save(pendingOrderAt(restaurantId)).getId();
        CountDownLatch locked = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            Future<?> cancellation = executor.submit(() -> transactionTemplate.executeWithoutResult(status -> {
                Order order = orderRepository.findByIdForUpdate(orderId).orElseThrow();
                locked.countDown();
                awaitQuietly(release);
                order.cancel(NOW);
                orderRepository.save(order);
            }));
            assertThat(locked.await(5, SECONDS)).isTrue();
            Future<Order> acceptance = executor.submit(() -> acceptOrder.execute(OWNER, orderId));

            assertThatThrownBy(() -> acceptance.get(500, MILLISECONDS)).isInstanceOf(TimeoutException.class);
            release.countDown();
            cancellation.get(5, SECONDS);

            assertThatThrownBy(() -> acceptance.get(5, SECONDS))
                    .hasCauseInstanceOf(InvalidOrderTransitionException.class);
            assertThat(statusOf(orderId)).isEqualTo(OrderStatus.CANCELLED);
        } finally {
            release.countDown();
            executor.shutdownNow();
        }
    }

    private OrderStatus statusOf(Long orderId) {
        return transactionTemplate.execute(
                status -> orderRepository.findById(orderId).orElseThrow().getStatus());
    }

    private static void awaitQuietly(CountDownLatch latch) {
        try {
            latch.await(5, SECONDS);
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
        }
    }

    private static Order pendingOrderAt(Long restaurantId) {
        return new Order(
                null,
                CUSTOMER,
                restaurantId,
                "La Casona",
                OrderStatus.PLACED,
                new BigDecimal("45.00"),
                NOW,
                NOW,
                List.of(new OrderItem(null, 10L, "Silpancho", new BigDecimal("45.00"), 1)));
    }
}
