package com.nur.pedidos.order.application;

import com.nur.pedidos.order.domain.model.Order;
import com.nur.pedidos.order.domain.model.OrderChange;
import com.nur.pedidos.order.domain.model.OrderLines;
import com.nur.pedidos.order.domain.model.RestaurantSnapshot;
import com.nur.pedidos.order.domain.port.OrderChangePublisher;
import com.nur.pedidos.order.domain.port.OrderRepository;
import com.nur.pedidos.order.domain.port.ProductCatalog;
import com.nur.pedidos.order.domain.port.RestaurantDirectory;
import java.time.Clock;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PlaceOrderUseCase {

    private final RestaurantDirectory restaurantDirectory;
    private final ProductCatalog productCatalog;
    private final OrderRepository orderRepository;
    private final OrderChangePublisher orderChangePublisher;
    private final Clock clock;

    @Transactional
    public Order execute(PlaceOrderCommand command) {
        OrderLines lines = new OrderLines(command.lines());
        RestaurantSnapshot restaurant = restaurantDirectory.restaurantTakingOrders(command.restaurantId());
        Order order = Order.place(
                command.customerId(), restaurant, lines, productCatalog.productsOf(restaurant.id()), clock.instant());
        Order saved = orderRepository.save(order);
        orderChangePublisher.publish(OrderChange.of(saved));
        return saved;
    }
}
