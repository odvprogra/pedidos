package com.nur.pedidos.catalog.application;

import com.nur.pedidos.catalog.domain.port.RestaurantDirectory;
import com.nur.pedidos.restaurant.domain.exception.RestaurantNotFoundException;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

class InMemoryRestaurantDirectory implements RestaurantDirectory {

    private final Map<Long, Long> restaurantIdsByOwner = new HashMap<>();

    void register(Long ownerId, Long restaurantId) {
        restaurantIdsByOwner.put(ownerId, restaurantId);
    }

    @Override
    public Long restaurantIdOf(Long ownerId) {
        return Optional.ofNullable(restaurantIdsByOwner.get(ownerId)).orElseThrow(RestaurantNotFoundException::new);
    }
}
