package com.nur.pedidos.restaurant.infrastructure.persistence;

import com.nur.pedidos.restaurant.domain.model.Restaurant;
import com.nur.pedidos.restaurant.domain.port.RestaurantRepository;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
class RestaurantPersistenceAdapter implements RestaurantRepository {

    private final RestaurantJpaRepository jpaRepository;

    @Override
    public Restaurant save(Restaurant restaurant) {
        return jpaRepository.save(RestaurantEntity.fromDomain(restaurant)).toDomain();
    }

    @Override
    public Optional<Restaurant> findByOwnerId(Long ownerId) {
        return jpaRepository.findByOwnerId(ownerId).map(RestaurantEntity::toDomain);
    }

    @Override
    public boolean existsByOwnerId(Long ownerId) {
        return jpaRepository.existsByOwnerId(ownerId);
    }
}
