package com.nur.pedidos.order.infrastructure.web;

import com.nur.pedidos.order.domain.model.Order;
import com.nur.pedidos.order.domain.model.OrderStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

record OrderResponse(
        Long id,
        Long restaurantId,
        String restaurantName,
        OrderStatus status,
        BigDecimal total,
        Instant placedAt,
        List<OrderItemResponse> items) {

    static OrderResponse from(Order order) {
        return new OrderResponse(
                order.getId(),
                order.getRestaurantId(),
                order.getRestaurantName(),
                order.getStatus(),
                order.getTotal(),
                order.getPlacedAt(),
                order.getItems().stream().map(OrderItemResponse::from).toList());
    }
}
