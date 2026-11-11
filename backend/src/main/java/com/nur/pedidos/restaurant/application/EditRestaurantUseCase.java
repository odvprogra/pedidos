package com.nur.pedidos.restaurant.application;

import com.nur.pedidos.restaurant.domain.exception.RestaurantNotFoundException;
import com.nur.pedidos.restaurant.domain.model.Restaurant;
import com.nur.pedidos.restaurant.domain.port.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EditRestaurantUseCase {

    private final RestaurantRepository restaurantRepository;

    @Transactional
    public Restaurant execute(EditRestaurantCommand command) {
        Restaurant restaurant = restaurantRepository
                .findByOwnerIdForUpdate(command.ownerId())
                .orElseThrow(RestaurantNotFoundException::new);
        restaurant.updateDetails(
                command.name(), command.description(), command.address(), command.category(), command.imageUrl());
        return restaurantRepository.save(restaurant);
    }
}
