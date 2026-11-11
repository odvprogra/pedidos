package com.nur.pedidos.restaurant.domain.port;

import com.nur.pedidos.restaurant.domain.model.Restaurant;
import java.util.Optional;

public interface RestaurantRepository {

    Restaurant save(Restaurant restaurant);

    Optional<Restaurant> findByOwnerId(Long ownerId);

    boolean existsByOwnerId(Long ownerId);
}
