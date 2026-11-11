package com.nur.pedidos.catalog.infrastructure.restaurant;

import com.nur.pedidos.catalog.domain.port.RestaurantDirectory;
import com.nur.pedidos.restaurant.application.GetOwnRestaurantUseCase;
import com.nur.pedidos.restaurant.application.GetVisibleRestaurantUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
class RestaurantDirectoryAdapter implements RestaurantDirectory {

    private final GetOwnRestaurantUseCase getOwnRestaurant;
    private final GetVisibleRestaurantUseCase getVisibleRestaurant;

    @Override
    public Long restaurantIdOf(Long ownerId) {
        return getOwnRestaurant.execute(ownerId).getId();
    }

    @Override
    public void ensureVisible(Long restaurantId) {
        getVisibleRestaurant.execute(restaurantId);
    }
}
