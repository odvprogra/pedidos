package com.nur.pedidos.restaurant.domain.exception;

import com.nur.pedidos.shared.domain.exception.ConflictException;

public class RestaurantSuspendedException extends ConflictException {

    public RestaurantSuspendedException() {
        super("restaurant.suspended", "El restaurante está suspendido y no se puede abrir");
    }
}
