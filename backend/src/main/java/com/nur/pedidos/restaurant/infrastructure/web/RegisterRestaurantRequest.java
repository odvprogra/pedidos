package com.nur.pedidos.restaurant.infrastructure.web;

import com.nur.pedidos.restaurant.application.RegisterRestaurantCommand;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

record RegisterRestaurantRequest(
        @NotBlank @Size(max = 120) String name,
        @Size(max = 300) String description,
        @NotBlank @Size(max = 200) String address) {

    RegisterRestaurantCommand toCommand(Long ownerId) {
        return new RegisterRestaurantCommand(ownerId, name, description, address);
    }
}
