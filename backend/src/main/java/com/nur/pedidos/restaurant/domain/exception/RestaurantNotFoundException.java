package com.nur.pedidos.restaurant.domain.exception;

import com.nur.pedidos.shared.domain.exception.NotFoundException;

public class RestaurantNotFoundException extends NotFoundException {

    public RestaurantNotFoundException() {
        super("restaurant.not_found", "No encontramos el restaurante");
    }
}
