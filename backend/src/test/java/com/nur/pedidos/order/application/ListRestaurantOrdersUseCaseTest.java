package com.nur.pedidos.order.application;

import static com.nur.pedidos.order.application.OrderFixtures.order;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nur.pedidos.order.domain.model.Order;
import com.nur.pedidos.order.domain.model.OrderStatus;
import com.nur.pedidos.restaurant.domain.exception.RestaurantNotFoundException;
import com.nur.pedidos.shared.domain.model.PageResult;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class ListRestaurantOrdersUseCaseTest {

    private static final Long OWNER = 3L;
    private static final Long LA_CASONA = 4L;
    private static final Long EL_FOGON = 5L;

    private final InMemoryRestaurantDirectory restaurantDirectory = new InMemoryRestaurantDirectory();
    private final InMemoryOrderRepository orderRepository = new InMemoryOrderRepository();
    private final ListRestaurantOrdersUseCase listRestaurantOrders =
            new ListRestaurantOrdersUseCase(restaurantDirectory, orderRepository);

    @BeforeEach
    void registerRestaurant() {
        restaurantDirectory.register(OWNER, LA_CASONA);
    }

    @Test
    void listsOnlyTheOrdersOfTheRestaurantOfTheOwner() {
        Order pending = orderRepository.save(order(7L, LA_CASONA, OrderStatus.PLACED));
        orderRepository.save(order(7L, EL_FOGON, OrderStatus.PLACED));
        Order delivered = orderRepository.save(order(8L, LA_CASONA, OrderStatus.PICKED_UP));

        PageResult<Order> page = listRestaurantOrders.execute(OWNER, Set.of(), 0, 20);

        assertThat(page.items()).extracting(Order::getId).containsExactly(delivered.getId(), pending.getId());
        assertThat(page.totalItems()).isEqualTo(2);
    }

    @Test
    void keepsOnlyTheRequestedStatuses() {
        Order pending = orderRepository.save(order(7L, LA_CASONA, OrderStatus.PLACED));
        Order ready = orderRepository.save(order(8L, LA_CASONA, OrderStatus.READY));
        orderRepository.save(order(9L, LA_CASONA, OrderStatus.PICKED_UP));
        orderRepository.save(order(9L, LA_CASONA, OrderStatus.CANCELLED));

        PageResult<Order> page = listRestaurantOrders.execute(
                OWNER, Set.of(OrderStatus.PLACED, OrderStatus.ACCEPTED, OrderStatus.READY), 0, 20);

        assertThat(page.items()).extracting(Order::getId).containsExactly(ready.getId(), pending.getId());
        assertThat(page.totalItems()).isEqualTo(2);
    }

    @Test
    void failsWhenTheOwnerHasNoRestaurant() {
        orderRepository.save(order(7L, LA_CASONA, OrderStatus.PLACED));

        assertThatThrownBy(() -> listRestaurantOrders.execute(9L, Set.of(), 0, 20))
                .isInstanceOf(RestaurantNotFoundException.class)
                .extracting("code")
                .isEqualTo("restaurant.not_found");
    }
}
