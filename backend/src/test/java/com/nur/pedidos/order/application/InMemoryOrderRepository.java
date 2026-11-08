package com.nur.pedidos.order.application;

import com.nur.pedidos.order.domain.model.Order;
import com.nur.pedidos.order.domain.model.OrderItem;
import com.nur.pedidos.order.domain.port.OrderRepository;
import java.util.List;
import java.util.TreeMap;

class InMemoryOrderRepository implements OrderRepository {

    private final TreeMap<Long, Order> orders = new TreeMap<>();
    private long orderSequence;
    private long itemSequence;

    @Override
    public Order save(Order order) {
        Long id = order.getId() != null ? order.getId() : ++orderSequence;
        Order saved = new Order(
                id,
                order.getCustomerId(),
                order.getRestaurantId(),
                order.getRestaurantName(),
                order.getStatus(),
                order.getTotal(),
                order.getPlacedAt(),
                order.getUpdatedAt(),
                order.getItems().stream().map(this::withId).toList());
        orders.put(id, saved);
        return saved;
    }

    List<Order> all() {
        return List.copyOf(orders.values());
    }

    private OrderItem withId(OrderItem item) {
        Long id = item.id() != null ? item.id() : ++itemSequence;
        return new OrderItem(id, item.productId(), item.productName(), item.unitPrice(), item.quantity());
    }
}
