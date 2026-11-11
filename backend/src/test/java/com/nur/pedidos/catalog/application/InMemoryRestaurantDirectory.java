package com.nur.pedidos.catalog.application;

import com.nur.pedidos.catalog.domain.port.RestaurantDirectory;
import com.nur.pedidos.restaurant.domain.exception.RestaurantNotFoundException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

class InMemoryRestaurantDirectory implements RestaurantDirectory {

    private final Map<Long, Long> restaurantIdsByOwner = new HashMap<>();
    private final Set<Long> suspendedRestaurantIds = new HashSet<>();

    void register(Long ownerId, Long restaurantId) {
        restaurantIdsByOwner.put(ownerId, restaurantId);
    }

    void suspend(Long restaurantId) {
        suspendedRestaurantIds.add(restaurantId);
    }

    @Override
    public Long restaurantIdOf(Long ownerId) {
        return Optional.ofNullable(restaurantIdsByOwner.get(ownerId)).orElseThrow(RestaurantNotFoundException::new);
    }

    @Override
    public void ensureVisible(Long restaurantId) {
        if (!restaurantIdsByOwner.containsValue(restaurantId) || suspendedRestaurantIds.contains(restaurantId)) {
            throw new RestaurantNotFoundException();
        }
    }
}
