package com.nur.pedidos.order.application;

import static com.nur.pedidos.order.application.OrderFixtures.PLACED_AT;
import static com.nur.pedidos.order.application.OrderFixtures.order;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nur.pedidos.order.domain.exception.InvalidOrderTransitionException;
import com.nur.pedidos.order.domain.exception.OrderNotFoundException;
import com.nur.pedidos.order.domain.exception.OrderNotOwnerException;
import com.nur.pedidos.order.domain.model.Order;
import com.nur.pedidos.order.domain.model.OrderStatus;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

class CancelOrderUseCaseTest {

    private static final Instant NOW = Instant.parse("2026-11-08T15:10:00Z");
    private static final Long ANA = 7L;
    private static final Long LUIS = 8L;

    private final InMemoryOrderRepository orderRepository = new InMemoryOrderRepository();
    private final CancelOrderUseCase cancelOrder =
            new CancelOrderUseCase(orderRepository, Clock.fixed(NOW, ZoneOffset.UTC));

    @Test
    void cancelsAPendingOrderOfTheCustomerAtTheTimeOfTheClock() {
        Order pending = orderRepository.save(order(ANA, 4L, OrderStatus.PLACED));

        Order cancelled = cancelOrder.execute(ANA, pending.getId());

        assertThat(cancelled.getStatus()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(orderRepository.get(pending.getId()))
                .extracting(Order::getStatus, Order::getPlacedAt, Order::getUpdatedAt)
                .containsExactly(OrderStatus.CANCELLED, PLACED_AT, NOW);
        assertThat(orderRepository.lockedIds()).containsExactly(pending.getId());
    }

    @Test
    void cancelsOnlyThatOrder() {
        Order first = orderRepository.save(order(ANA, 4L, OrderStatus.PLACED));
        Order second = orderRepository.save(order(ANA, 4L, OrderStatus.PLACED));

        cancelOrder.execute(ANA, first.getId());

        assertThat(orderRepository.get(second.getId()).getStatus()).isEqualTo(OrderStatus.PLACED);
    }

    @Test
    void refusesToCancelAnOrderThatWasAlreadyAccepted() {
        Order accepted = orderRepository.save(order(ANA, 4L, OrderStatus.ACCEPTED));

        assertThatThrownBy(() -> cancelOrder.execute(ANA, accepted.getId()))
                .isInstanceOf(InvalidOrderTransitionException.class)
                .extracting("code")
                .isEqualTo("order.invalid_transition");
        assertThat(orderRepository.get(accepted.getId()))
                .extracting(Order::getStatus, Order::getUpdatedAt)
                .containsExactly(OrderStatus.ACCEPTED, PLACED_AT);
    }

    @Test
    void refusesTheOrderOfAnotherCustomerBeforeLookingAtItsStatus() {
        Order luisOrder = orderRepository.save(order(LUIS, 4L, OrderStatus.ACCEPTED));

        assertThatThrownBy(() -> cancelOrder.execute(ANA, luisOrder.getId()))
                .isInstanceOf(OrderNotOwnerException.class)
                .extracting("code")
                .isEqualTo("order.not_owner");
        assertThat(orderRepository.get(luisOrder.getId()).getStatus()).isEqualTo(OrderStatus.ACCEPTED);
    }

    @Test
    void failsWhenTheOrderDoesNotExist() {
        assertThatThrownBy(() -> cancelOrder.execute(ANA, 99L))
                .isInstanceOf(OrderNotFoundException.class)
                .extracting("code")
                .isEqualTo("order.not_found");
    }
}
