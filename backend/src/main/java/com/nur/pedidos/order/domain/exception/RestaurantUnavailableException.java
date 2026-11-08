package com.nur.pedidos.order.domain.exception;

import com.nur.pedidos.shared.domain.exception.DomainException;

public class RestaurantUnavailableException extends DomainException {

    public RestaurantUnavailableException() {
        super("order.restaurant_unavailable", "El restaurante no está recibiendo pedidos");
    }
}
