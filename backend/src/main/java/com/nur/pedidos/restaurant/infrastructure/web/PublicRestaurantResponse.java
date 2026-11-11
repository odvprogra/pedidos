package com.nur.pedidos.restaurant.infrastructure.web;

import com.nur.pedidos.restaurant.domain.model.Restaurant;
import com.nur.pedidos.restaurant.domain.model.RestaurantCategory;

record PublicRestaurantResponse(
        Long id,
        String name,
        String description,
        String address,
        RestaurantCategory category,
        String imageUrl,
        boolean open) {

    static PublicRestaurantResponse from(Restaurant restaurant) {
        return new PublicRestaurantResponse(
                restaurant.getId(),
                restaurant.getName(),
                restaurant.getDescription(),
                restaurant.getAddress(),
                restaurant.getCategory(),
                restaurant.getImageUrl(),
                restaurant.isOpen());
    }
}
