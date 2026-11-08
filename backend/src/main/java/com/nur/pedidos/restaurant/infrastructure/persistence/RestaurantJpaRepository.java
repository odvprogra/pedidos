package com.nur.pedidos.restaurant.infrastructure.persistence;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

interface RestaurantJpaRepository extends JpaRepository<RestaurantEntity, Long> {

    Optional<RestaurantEntity> findByOwnerId(Long ownerId);

    boolean existsByOwnerId(Long ownerId);
}
