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

class MarkOrderPickedUpUseCaseTest {

    private static final Instant NOW = Instant.parse("2026-11-08T15:10:00Z");
    private static final Long OWNER = 3L;
    private static final Long LA_CASONA = 4L;
    private static final Long EL_FOGON = 5L;

    private final InMemoryRestaurantDirectory restaurantDirectory = new InMemoryRestaurantDirectory();
    private final InMemoryOrderRepository orderRepository = new InMemoryOrderRepository();
    private final MarkOrderPickedUpUseCase markOrderPickedUp =
            new MarkOrderPickedUpUseCase(restaurantDirectory, orderRepository, Clock.fixed(NOW, ZoneOffset.UTC));

    @BeforeEach
    void registerRestaurant() {
        restaurantDirectory.register(OWNER, LA_CASONA);
    }

    @Test
    void marksAReadyOrderAsPickedUpAtTheTimeOfTheClock() {
        Order saved = orderRepository.save(order(7L, LA_CASONA, OrderStatus.READY));

        Order changed = markOrderPickedUp.execute(OWNER, saved.getId());

        assertThat(changed.getStatus()).isEqualTo(OrderStatus.PICKED_UP);
        assertThat(orderRepository.get(saved.getId()))
                .extracting(Order::getStatus, Order::getPlacedAt, Order::getUpdatedAt)
                .containsExactly(OrderStatus.PICKED_UP, PLACED_AT, NOW);
    }

    @Test
    void changesOnlyThatOrder() {
        Order first = orderRepository.save(order(7L, LA_CASONA, OrderStatus.READY));
        Order second = orderRepository.save(order(8L, LA_CASONA, OrderStatus.READY));

        markOrderPickedUp.execute(OWNER, first.getId());

        assertThat(orderRepository.get(second.getId()).getStatus()).isEqualTo(OrderStatus.READY);
    }

    @Test
    void refusesAnOrderThatIsNotReadyYet() {
        Order saved = orderRepository.save(order(7L, LA_CASONA, OrderStatus.ACCEPTED));

        assertThatThrownBy(() -> markOrderPickedUp.execute(OWNER, saved.getId()))
                .isInstanceOf(InvalidOrderTransitionException.class)
                .extracting("code")
                .isEqualTo("order.invalid_transition");
        assertThat(orderRepository.get(saved.getId()))
                .extracting(Order::getStatus, Order::getUpdatedAt)
                .containsExactly(OrderStatus.ACCEPTED, PLACED_AT);
    }

    @Test
    void refusesAnOrderOfAnotherRestaurant() {
        Order foreign = orderRepository.save(order(7L, EL_FOGON, OrderStatus.READY));

        assertThatThrownBy(() -> markOrderPickedUp.execute(OWNER, foreign.getId()))
                .isInstanceOf(OrderNotOwnerException.class)
                .extracting("code")
                .isEqualTo("order.not_owner");
        assertThat(orderRepository.get(foreign.getId()).getStatus()).isEqualTo(OrderStatus.READY);
    }

    @Test
    void failsWhenTheOrderDoesNotExist() {
        assertThatThrownBy(() -> markOrderPickedUp.execute(OWNER, 99L))
                .isInstanceOf(OrderNotFoundException.class)
                .extracting("code")
                .isEqualTo("order.not_found");
    }

    @Test
    void failsWhenTheOwnerHasNoRestaurant() {
        Order saved = orderRepository.save(order(7L, LA_CASONA, OrderStatus.READY));

        assertThatThrownBy(() -> markOrderPickedUp.execute(9L, saved.getId()))
                .isInstanceOf(RestaurantNotFoundException.class)
                .extracting("code")
                .isEqualTo("restaurant.not_found");
        assertThat(orderRepository.get(saved.getId()).getStatus()).isEqualTo(OrderStatus.READY);
    }
}
