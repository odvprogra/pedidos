package com.nur.pedidos.restaurant.application;

import com.nur.pedidos.restaurant.domain.exception.RestaurantNotFoundException;
import com.nur.pedidos.restaurant.domain.model.Restaurant;
import com.nur.pedidos.restaurant.domain.port.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReactivateRestaurantUseCase {

    private final RestaurantRepository restaurantRepository;

    @Transactional
    public Restaurant execute(Long restaurantId) {
        Restaurant restaurant =
                restaurantRepository.findByIdForUpdate(restaurantId).orElseThrow(RestaurantNotFoundException::new);
        restaurant.reactivate();
        return restaurantRepository.save(restaurant);
    }
}
