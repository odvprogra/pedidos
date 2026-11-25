package com.nur.pedidos.order.domain.model;

public record OrderChange(Long orderId, Long restaurantId, Long customerId, OrderStatus status) {

    public static OrderChange of(Order order) {
        return new OrderChange(order.getId(), order.getRestaurantId(), order.getCustomerId(), order.getStatus());
    }
}
