package com.nur.pedidos.restaurant.infrastructure.web;

import com.nur.pedidos.restaurant.domain.model.Restaurant;
import com.nur.pedidos.restaurant.domain.model.RestaurantCategory;

record RestaurantResponse(
        Long id,
        String name,
        String description,
        String address,
        RestaurantCategory category,
        String imageUrl,
        boolean open,
        boolean suspended) {

    static RestaurantResponse from(Restaurant restaurant) {
        return new RestaurantResponse(
                restaurant.getId(),
                restaurant.getName(),
                restaurant.getDescription(),
                restaurant.getAddress(),
                restaurant.getCategory(),
                restaurant.getImageUrl(),
                restaurant.isOpen(),
                restaurant.isSuspended());
    }
}
