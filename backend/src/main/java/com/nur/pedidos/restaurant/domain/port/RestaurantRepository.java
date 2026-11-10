package com.nur.pedidos.restaurant.domain.port;

import com.nur.pedidos.restaurant.domain.model.Restaurant;
import com.nur.pedidos.shared.domain.model.PageResult;
import java.util.Optional;

public interface RestaurantRepository {

    Restaurant save(Restaurant restaurant);

    Optional<Restaurant> findById(Long id);

    Optional<Restaurant> findByOwnerId(Long ownerId);

    boolean existsByOwnerId(Long ownerId);

    PageResult<Restaurant> findVisibleOpenFirst(int page, int size);

    PageResult<Restaurant> findPageInRegistrationOrder(int page, int size);
}
