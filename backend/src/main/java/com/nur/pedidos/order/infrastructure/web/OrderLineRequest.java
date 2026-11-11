package com.nur.pedidos.order.infrastructure.web;

import com.nur.pedidos.order.domain.model.OrderLine;
import jakarta.validation.constraints.NotNull;

record OrderLineRequest(@NotNull Long productId, @NotNull Integer quantity) {

    OrderLine toLine() {
        return new OrderLine(productId, quantity);
    }
}
