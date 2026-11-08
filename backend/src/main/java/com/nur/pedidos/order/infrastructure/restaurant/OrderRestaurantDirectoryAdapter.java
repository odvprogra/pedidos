package com.nur.pedidos.order.infrastructure.restaurant;

import com.nur.pedidos.order.domain.exception.RestaurantUnavailableException;
import com.nur.pedidos.order.domain.model.RestaurantSnapshot;
import com.nur.pedidos.order.domain.port.RestaurantDirectory;
import com.nur.pedidos.restaurant.application.GetVisibleRestaurantUseCase;
import com.nur.pedidos.restaurant.domain.exception.RestaurantNotFoundException;
import com.nur.pedidos.restaurant.domain.model.Restaurant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
class OrderRestaurantDirectoryAdapter implements RestaurantDirectory {

    private final GetVisibleRestaurantUseCase getVisibleRestaurant;

    @Override
    public RestaurantSnapshot restaurantTakingOrders(Long restaurantId) {
        Restaurant restaurant = visibleRestaurant(restaurantId);
        if (!restaurant.acceptsOrders()) {
            throw new RestaurantUnavailableException();
        }
        return new RestaurantSnapshot(restaurant.getId(), restaurant.getName());
    }

    private Restaurant visibleRestaurant(Long restaurantId) {
        try {
            return getVisibleRestaurant.execute(restaurantId);
        } catch (RestaurantNotFoundException hidden) {
            throw new RestaurantUnavailableException();
        }
    }
}
