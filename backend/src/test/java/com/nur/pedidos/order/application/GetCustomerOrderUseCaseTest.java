package com.nur.pedidos.order.application;

import static com.nur.pedidos.order.application.OrderFixtures.order;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nur.pedidos.order.domain.exception.OrderNotFoundException;
import com.nur.pedidos.order.domain.exception.OrderNotOwnerException;
import com.nur.pedidos.order.domain.model.Order;
import com.nur.pedidos.order.domain.model.OrderItem;
import com.nur.pedidos.order.domain.model.OrderStatus;
import org.junit.jupiter.api.Test;

class GetCustomerOrderUseCaseTest {

    private static final Long ANA = 7L;
    private static final Long LUIS = 8L;

    private final InMemoryOrderRepository orderRepository = new InMemoryOrderRepository();
    private final GetCustomerOrderUseCase getCustomerOrder = new GetCustomerOrderUseCase(orderRepository);

    @Test
    void givesTheCustomerTheirOrderWithItsItems() {
        Order saved = orderRepository.save(order(ANA, 4L, OrderStatus.ACCEPTED));

        Order order = getCustomerOrder.execute(ANA, saved.getId());

        assertThat(order)
                .extracting(Order::getId, Order::getStatus, Order::getRestaurantName)
                .containsExactly(saved.getId(), OrderStatus.ACCEPTED, "La Casona");
        assertThat(order.getItems()).extracting(OrderItem::productName).containsExactly("Silpancho");
    }

    @Test
    void refusesTheOrderOfAnotherCustomer() {
        Order luisOrder = orderRepository.save(order(LUIS, 4L, OrderStatus.PLACED));

        assertThatThrownBy(() -> getCustomerOrder.execute(ANA, luisOrder.getId()))
                .isInstanceOf(OrderNotOwnerException.class)
                .extracting("code")
                .isEqualTo("order.not_owner");
    }

    @Test
    void failsWhenTheOrderDoesNotExist() {
        assertThatThrownBy(() -> getCustomerOrder.execute(ANA, 99L))
                .isInstanceOf(OrderNotFoundException.class)
                .extracting("code")
                .isEqualTo("order.not_found");
    }
}
