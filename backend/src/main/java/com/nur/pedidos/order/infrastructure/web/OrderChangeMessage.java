package com.nur.pedidos.order.infrastructure.web;

import com.nur.pedidos.order.domain.model.OrderChange;
import com.nur.pedidos.order.domain.model.OrderStatus;

record OrderChangeMessage(Long orderId, OrderStatus status) {

    static OrderChangeMessage from(OrderChange change) {
        return new OrderChangeMessage(change.orderId(), change.status());
    }
}
