package com.nur.pedidos.restaurant.infrastructure.web;

import com.nur.pedidos.restaurant.application.EditRestaurantCommand;
import com.nur.pedidos.restaurant.application.RegisterRestaurantCommand;
import com.nur.pedidos.restaurant.domain.model.RestaurantCategory;
import com.nur.pedidos.shared.domain.model.ImageUrls;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

record RestaurantRequest(
        @NotBlank @Size(max = 120) String name,
        @Size(max = 300) String description,
        @NotBlank @Size(max = 200) String address,
        @NotNull RestaurantCategory category,
        @Size(max = ImageUrls.MAX_LENGTH) String imageUrl) {

    RegisterRestaurantCommand toRegisterCommand(Long ownerId) {
        return new RegisterRestaurantCommand(ownerId, name, description, address, category, imageUrl);
    }

    EditRestaurantCommand toEditCommand(Long ownerId) {
        return new EditRestaurantCommand(ownerId, name, description, address, category, imageUrl);
    }
}
