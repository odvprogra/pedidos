package com.nur.pedidos.order.application;

import com.nur.pedidos.order.domain.exception.RestaurantUnavailableException;
import com.nur.pedidos.order.domain.model.RestaurantSnapshot;
import com.nur.pedidos.order.domain.port.RestaurantDirectory;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

class InMemoryRestaurantDirectory implements RestaurantDirectory {

    private final Map<Long, String> namesOfRestaurantsTakingOrders = new HashMap<>();

    void takeOrders(Long restaurantId, String name) {
        namesOfRestaurantsTakingOrders.put(restaurantId, name);
    }

    @Override
    public RestaurantSnapshot restaurantTakingOrders(Long restaurantId) {
        return Optional.ofNullable(namesOfRestaurantsTakingOrders.get(restaurantId))
                .map(name -> new RestaurantSnapshot(restaurantId, name))
                .orElseThrow(RestaurantUnavailableException::new);
    }
}
