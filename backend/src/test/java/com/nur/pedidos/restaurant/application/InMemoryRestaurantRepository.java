package com.nur.pedidos.restaurant.application;

import com.nur.pedidos.restaurant.domain.model.Restaurant;
import com.nur.pedidos.restaurant.domain.port.RestaurantRepository;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

class InMemoryRestaurantRepository implements RestaurantRepository {

    private final Map<Long, Restaurant> restaurants = new HashMap<>();
    private long sequence;

    @Override
    public Restaurant save(Restaurant restaurant) {
        Long id = restaurant.getId() != null ? restaurant.getId() : ++sequence;
        restaurants.put(id, copyOf(restaurant, id));
        return copyOf(restaurant, id);
    }

    @Override
    public Optional<Restaurant> findByOwnerId(Long ownerId) {
        return restaurants.values().stream()
                .filter(restaurant -> restaurant.getOwnerId().equals(ownerId))
                .findFirst()
                .map(restaurant -> copyOf(restaurant, restaurant.getId()));
    }

    @Override
    public boolean existsByOwnerId(Long ownerId) {
        return findByOwnerId(ownerId).isPresent();
    }

    int count() {
        return restaurants.size();
    }

    private static Restaurant copyOf(Restaurant restaurant, Long id) {
        return new Restaurant(
                id,
                restaurant.getOwnerId(),
                restaurant.getName(),
                restaurant.getDescription(),
                restaurant.getAddress(),
                restaurant.isOpen(),
                restaurant.isSuspended(),
                restaurant.getCreatedAt());
    }
}
