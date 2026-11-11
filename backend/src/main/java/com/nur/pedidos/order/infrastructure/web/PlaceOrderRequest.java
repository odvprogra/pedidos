package com.nur.pedidos.order.infrastructure.web;

import com.nur.pedidos.order.application.PlaceOrderCommand;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;

record PlaceOrderRequest(
        @NotNull Long restaurantId, @NotNull List<@NotNull @Valid OrderLineRequest> items) {

    PlaceOrderCommand toCommand(Long customerId) {
        return new PlaceOrderCommand(
                customerId,
                restaurantId,
                items.stream().map(OrderLineRequest::toLine).toList());
    }
}
