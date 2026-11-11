package com.nur.pedidos.restaurant.domain.exception;

import com.nur.pedidos.shared.domain.exception.ConflictException;

public class RestaurantAlreadyRegisteredException extends ConflictException {

    public RestaurantAlreadyRegisteredException() {
        super("restaurant.already_registered", "Ya registraste un restaurante");
    }
}
