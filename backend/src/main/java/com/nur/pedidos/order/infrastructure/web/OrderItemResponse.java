package com.nur.pedidos.order.infrastructure.web;

import com.nur.pedidos.order.domain.model.OrderItem;
import java.math.BigDecimal;

record OrderItemResponse(Long productId, String productName, BigDecimal unitPrice, int quantity, BigDecimal subtotal) {

    static OrderItemResponse from(OrderItem item) {
        return new OrderItemResponse(
                item.productId(), item.productName(), item.unitPrice(), item.quantity(), item.subtotal());
    }
}
