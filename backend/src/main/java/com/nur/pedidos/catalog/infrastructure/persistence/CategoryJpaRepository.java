package com.nur.pedidos.catalog.infrastructure.persistence;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

interface CategoryJpaRepository extends JpaRepository<CategoryEntity, Long> {

    @Query("select c from CategoryEntity c where c.restaurantId = :restaurantId and lower(c.name) = lower(:name)")
    Optional<CategoryEntity> findByRestaurantIdAndNameIgnoringCase(Long restaurantId, String name);

    List<CategoryEntity> findAllByRestaurantIdOrderByIdAsc(Long restaurantId);
}
