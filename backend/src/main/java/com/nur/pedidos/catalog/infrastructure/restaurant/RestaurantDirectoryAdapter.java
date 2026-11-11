package com.nur.pedidos.catalog.infrastructure.restaurant;

import com.nur.pedidos.catalog.domain.port.RestaurantDirectory;
import com.nur.pedidos.restaurant.application.GetOwnRestaurantUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
class RestaurantDirectoryAdapter implements RestaurantDirectory {

    private final GetOwnRestaurantUseCase getOwnRestaurant;

    @Override
    public Long restaurantIdOf(Long ownerId) {
        return getOwnRestaurant.execute(ownerId).getId();
    }
}
