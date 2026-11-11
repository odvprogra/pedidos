package com.nur.pedidos.restaurant.infrastructure.persistence;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

interface RestaurantJpaRepository extends JpaRepository<RestaurantEntity, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<RestaurantEntity> findForUpdateById(Long id);

    Optional<RestaurantEntity> findByOwnerId(Long ownerId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<RestaurantEntity> findForUpdateByOwnerId(Long ownerId);

    boolean existsByOwnerId(Long ownerId);

    Page<RestaurantEntity> findAllBySuspendedFalse(Pageable pageable);
}
