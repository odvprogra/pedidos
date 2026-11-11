package com.nur.pedidos.restaurant.infrastructure.web;

import com.nur.pedidos.restaurant.domain.model.Restaurant;

record PublicRestaurantResponse(Long id, String name, String description, String address, boolean open) {

    static PublicRestaurantResponse from(Restaurant restaurant) {
        return new PublicRestaurantResponse(
                restaurant.getId(),
                restaurant.getName(),
                restaurant.getDescription(),
                restaurant.getAddress(),
                restaurant.isOpen());
    }
}
