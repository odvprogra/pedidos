package com.nur.pedidos.restaurant.application;

import com.nur.pedidos.restaurant.domain.exception.RestaurantNotFoundException;
import com.nur.pedidos.restaurant.domain.model.Restaurant;
import com.nur.pedidos.restaurant.domain.port.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OpenRestaurantUseCase {

    private final RestaurantRepository restaurantRepository;

    @Transactional
    public void execute(Long ownerId) {
        Restaurant restaurant =
                restaurantRepository.findByOwnerId(ownerId).orElseThrow(RestaurantNotFoundException::new);
        restaurant.open();
        restaurantRepository.save(restaurant);
    }
}
