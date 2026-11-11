package com.nur.pedidos.restaurant.application;

import com.nur.pedidos.restaurant.domain.model.RestaurantCategory;

public record RegisterRestaurantCommand(
        Long ownerId, String name, String description, String address, RestaurantCategory category, String imageUrl) {}
