package com.nur.pedidos.restaurant.application;

public record RegisterRestaurantCommand(Long ownerId, String name, String description, String address) {}
