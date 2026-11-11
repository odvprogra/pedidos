package com.nur.pedidos.restaurant.application;

import com.nur.pedidos.restaurant.domain.exception.RestaurantNotFoundException;
import com.nur.pedidos.restaurant.domain.model.Restaurant;
import com.nur.pedidos.restaurant.domain.port.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GetOwnRestaurantUseCase {

    private final RestaurantRepository restaurantRepository;

    @Transactional(readOnly = true)
    public Restaurant execute(Long ownerId) {
        return restaurantRepository.findByOwnerId(ownerId).orElseThrow(RestaurantNotFoundException::new);
    }
}
