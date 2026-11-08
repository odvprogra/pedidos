package com.nur.pedidos.catalog.infrastructure.persistence;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

interface ProductJpaRepository extends JpaRepository<ProductEntity, Long> {

    List<ProductEntity> findAllByRestaurantIdOrderByIdAsc(Long restaurantId);

    boolean existsByCategoryId(Long categoryId);
}
