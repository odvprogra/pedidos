package com.nur.pedidos.order.application;

import static com.nur.pedidos.order.application.OrderFixtures.order;
import static org.assertj.core.api.Assertions.assertThat;

import com.nur.pedidos.order.domain.model.Order;
import com.nur.pedidos.order.domain.model.OrderStatus;
import com.nur.pedidos.shared.domain.model.PageResult;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class ListCustomerOrdersUseCaseTest {

    private static final Long ANA = 7L;
    private static final Long LUIS = 8L;

    private final InMemoryOrderRepository orderRepository = new InMemoryOrderRepository();
    private final ListCustomerOrdersUseCase listCustomerOrders = new ListCustomerOrdersUseCase(orderRepository);

    @Test
    void listsOnlyTheOrdersOfTheCustomerWithTheNewestFirst() {
        Order monday = orderRepository.save(order(ANA, 4L, OrderStatus.PICKED_UP, at("2026-11-02T12:00:00Z")));
        orderRepository.save(order(LUIS, 4L, OrderStatus.PLACED, at("2026-11-08T12:00:00Z")));
        Order friday = orderRepository.save(order(ANA, 5L, OrderStatus.PLACED, at("2026-11-06T12:00:00Z")));

        PageResult<Order> page = listCustomerOrders.execute(ANA, 0, 20);

        assertThat(page.items()).extracting(Order::getId).containsExactly(friday.getId(), monday.getId());
        assertThat(page.totalItems()).isEqualTo(2);
    }

    @Test
    void returnsTheRequestedPageWithTheRealTotals() {
        for (int day = 1; day <= 5; day++) {
            orderRepository.save(order(ANA, 4L, OrderStatus.PLACED, at("2026-11-0" + day + "T12:00:00Z")));
        }

        PageResult<Order> page = listCustomerOrders.execute(ANA, 1, 2);

        assertThat(page.items())
                .extracting(Order::getPlacedAt)
                .containsExactly(at("2026-11-03T12:00:00Z"), at("2026-11-02T12:00:00Z"));
        assertThat(page.totalItems()).isEqualTo(5);
        assertThat(page.totalPages()).isEqualTo(3);
    }

    @Test
    void returnsAnEmptyPageToACustomerWithoutOrders() {
        orderRepository.save(order(LUIS, 4L, OrderStatus.PLACED));

        PageResult<Order> page = listCustomerOrders.execute(ANA, 0, 20);

        assertThat(page.items()).isEmpty();
        assertThat(page.totalItems()).isZero();
    }

    private static Instant at(String instant) {
        return Instant.parse(instant);
    }
}
