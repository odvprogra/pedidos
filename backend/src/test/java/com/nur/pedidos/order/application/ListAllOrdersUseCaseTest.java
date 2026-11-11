package com.nur.pedidos.order.application;

import static com.nur.pedidos.order.application.OrderFixtures.order;
import static org.assertj.core.api.Assertions.assertThat;

import com.nur.pedidos.order.domain.model.Order;
import com.nur.pedidos.order.domain.model.OrderStatus;
import com.nur.pedidos.shared.domain.model.PageResult;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class ListAllOrdersUseCaseTest {

    private final InMemoryOrderRepository orderRepository = new InMemoryOrderRepository();
    private final ListAllOrdersUseCase listAllOrders = new ListAllOrdersUseCase(orderRepository);

    @Test
    void listsTheOrdersOfEveryCustomerAndRestaurantWithTheNewestFirst() {
        Order monday = orderRepository.save(order(7L, 4L, OrderStatus.PICKED_UP, at("2026-11-02T12:00:00Z")));
        Order sunday = orderRepository.save(order(8L, 5L, OrderStatus.CANCELLED, at("2026-11-08T12:00:00Z")));
        Order friday = orderRepository.save(order(9L, 4L, OrderStatus.PLACED, at("2026-11-06T12:00:00Z")));

        PageResult<Order> page = listAllOrders.execute(0, 20);

        assertThat(page.items())
                .extracting(Order::getId)
                .containsExactly(sunday.getId(), friday.getId(), monday.getId());
        assertThat(page.totalItems()).isEqualTo(3);
    }

    @Test
    void returnsTheRequestedPageWithTheRealTotals() {
        for (int day = 1; day <= 5; day++) {
            orderRepository.save(order(7L, 4L, OrderStatus.PLACED, at("2026-11-0" + day + "T12:00:00Z")));
        }

        PageResult<Order> page = listAllOrders.execute(1, 2);

        assertThat(page.items())
                .extracting(Order::getPlacedAt)
                .containsExactly(at("2026-11-03T12:00:00Z"), at("2026-11-02T12:00:00Z"));
        assertThat(page.totalItems()).isEqualTo(5);
        assertThat(page.totalPages()).isEqualTo(3);
    }

    @Test
    void returnsAnEmptyPageWhenNobodyOrderedYet() {
        PageResult<Order> page = listAllOrders.execute(0, 20);

        assertThat(page.items()).isEmpty();
        assertThat(page.totalItems()).isZero();
    }

    private static Instant at(String instant) {
        return Instant.parse(instant);
    }
}
