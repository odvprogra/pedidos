package com.nur.pedidos.restaurant.application;

import com.nur.pedidos.restaurant.domain.exception.RestaurantAlreadyRegisteredException;
import com.nur.pedidos.restaurant.domain.model.Restaurant;
import com.nur.pedidos.restaurant.domain.port.RestaurantRepository;
import java.time.Clock;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RegisterRestaurantUseCase {

    private final RestaurantRepository restaurantRepository;
    private final Clock clock;

    @Transactional
    public Restaurant execute(RegisterRestaurantCommand command) {
        if (restaurantRepository.existsByOwnerId(command.ownerId())) {
            throw new RestaurantAlreadyRegisteredException();
        }
        Restaurant restaurant = Restaurant.register(
                command.ownerId(), command.name(), command.description(), command.address(), clock.instant());
        return restaurantRepository.save(restaurant);
    }
}
