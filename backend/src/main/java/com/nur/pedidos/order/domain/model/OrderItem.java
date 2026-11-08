package com.nur.pedidos.order.domain.model;

import java.math.BigDecimal;

public record OrderItem(Long id, Long productId, String productName, BigDecimal unitPrice, int quantity) {

    static OrderItem of(ProductSnapshot product, int quantity) {
        return new OrderItem(null, product.id(), product.name(), product.price(), quantity);
    }

    public BigDecimal subtotal() {
        return unitPrice.multiply(BigDecimal.valueOf(quantity));
    }
}
