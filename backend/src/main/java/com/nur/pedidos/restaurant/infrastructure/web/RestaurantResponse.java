package com.nur.pedidos.restaurant.infrastructure.web;

import com.nur.pedidos.restaurant.domain.model.Restaurant;

record RestaurantResponse(Long id, String name, String description, String address, boolean open, boolean suspended) {

    static RestaurantResponse from(Restaurant restaurant) {
        return new RestaurantResponse(
                restaurant.getId(),
                restaurant.getName(),
                restaurant.getDescription(),
                restaurant.getAddress(),
                restaurant.isOpen(),
                restaurant.isSuspended());
    }
}
