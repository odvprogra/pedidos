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
import com.nur.pedidos.restaurant.domain.exception.RestaurantNotFoundException;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

class MarkOrderReadyUseCaseTest {

    private static final Instant NOW = Instant.parse("2026-11-08T15:10:00Z");
    private static final Long OWNER = 3L;
    private static final Long LA_CASONA = 4L;
    private static final Long EL_FOGON = 5L;

    private final InMemoryRestaurantDirectory restaurantDirectory = new InMemoryRestaurantDirectory();
    private final InMemoryOrderRepository orderRepository = new InMemoryOrderRepository();
    private final MarkOrderReadyUseCase markOrderReady =
            new MarkOrderReadyUseCase(restaurantDirectory, orderRepository, Clock.fixed(NOW, ZoneOffset.UTC));

    @BeforeEach
    void registerRestaurant() {
        restaurantDirectory.register(OWNER, LA_CASONA);
    }

    @Test
    void marksAnOrderInPreparationAsReadyAtTheTimeOfTheClock() {
        Order saved = orderRepository.save(order(7L, LA_CASONA, OrderStatus.IN_PREPARATION));

        Order changed = markOrderReady.execute(OWNER, saved.getId());

        assertThat(changed.getStatus()).isEqualTo(OrderStatus.READY);
        assertThat(orderRepository.get(saved.getId()))
                .extracting(Order::getStatus, Order::getPlacedAt, Order::getUpdatedAt)
                .containsExactly(OrderStatus.READY, PLACED_AT, NOW);
        assertThat(orderRepository.lockedIds()).containsExactly(saved.getId());
    }

    @Test
    void changesOnlyThatOrder() {
        Order first = orderRepository.save(order(7L, LA_CASONA, OrderStatus.IN_PREPARATION));
        Order second = orderRepository.save(order(8L, LA_CASONA, OrderStatus.IN_PREPARATION));

        markOrderReady.execute(OWNER, first.getId());

        assertThat(orderRepository.get(second.getId()).getStatus()).isEqualTo(OrderStatus.IN_PREPARATION);
    }

    @ParameterizedTest
    @EnumSource(
            value = OrderStatus.class,
            names = {"PLACED", "ACCEPTED"})
    void refusesAnOrderThatIsNotInPreparationYet(OrderStatus status) {
        Order saved = orderRepository.save(order(7L, LA_CASONA, status));

        assertThatThrownBy(() -> markOrderReady.execute(OWNER, saved.getId()))
                .isInstanceOf(InvalidOrderTransitionException.class)
                .extracting("code")
                .isEqualTo("order.invalid_transition");
        assertThat(orderRepository.get(saved.getId()))
                .extracting(Order::getStatus, Order::getUpdatedAt)
                .containsExactly(status, PLACED_AT);
    }

    @Test
    void refusesAnOrderOfAnotherRestaurant() {
        Order foreign = orderRepository.save(order(7L, EL_FOGON, OrderStatus.IN_PREPARATION));

        assertThatThrownBy(() -> markOrderReady.execute(OWNER, foreign.getId()))
                .isInstanceOf(OrderNotOwnerException.class)
                .extracting("code")
                .isEqualTo("order.not_owner");
        assertThat(orderRepository.get(foreign.getId()).getStatus()).isEqualTo(OrderStatus.IN_PREPARATION);
    }

    @Test
    void failsWhenTheOrderDoesNotExist() {
        assertThatThrownBy(() -> markOrderReady.execute(OWNER, 99L))
                .isInstanceOf(OrderNotFoundException.class)
                .extracting("code")
                .isEqualTo("order.not_found");
    }

    @Test
    void failsWhenTheOwnerHasNoRestaurant() {
        Order saved = orderRepository.save(order(7L, LA_CASONA, OrderStatus.IN_PREPARATION));

        assertThatThrownBy(() -> markOrderReady.execute(9L, saved.getId()))
                .isInstanceOf(RestaurantNotFoundException.class)
                .extracting("code")
                .isEqualTo("restaurant.not_found");
        assertThat(orderRepository.get(saved.getId()).getStatus()).isEqualTo(OrderStatus.IN_PREPARATION);
    }
}
