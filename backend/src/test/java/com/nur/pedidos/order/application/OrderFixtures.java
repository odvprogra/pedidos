package com.nur.pedidos.order.application;

import com.nur.pedidos.order.domain.model.Order;
import com.nur.pedidos.order.domain.model.OrderItem;
import com.nur.pedidos.order.domain.model.OrderStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

final class OrderFixtures {

    static final Instant PLACED_AT = Instant.parse("2026-11-08T15:00:00Z");

    private OrderFixtures() {}

    static Order order(Long customerId, Long restaurantId, OrderStatus status) {
        return order(customerId, restaurantId, status, PLACED_AT);
    }

    static Order order(Long customerId, Long restaurantId, OrderStatus status, Instant placedAt) {
        return new Order(
                null,
                customerId,
                restaurantId,
                "La Casona",
                status,
                new BigDecimal("90.00"),
                placedAt,
                placedAt,
                List.of(new OrderItem(null, 10L, "Silpancho", new BigDecimal("45.00"), 2)));
    }
}
