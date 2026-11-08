package com.nur.pedidos.catalog.infrastructure.web;

import com.nur.pedidos.catalog.application.GetRestaurantCatalogUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/restaurants/{restaurantId}/catalog")
@RequiredArgsConstructor
class PublicCatalogController {

    private final GetRestaurantCatalogUseCase getRestaurantCatalog;

    @GetMapping
    CatalogResponse get(@PathVariable Long restaurantId) {
        return CatalogResponse.from(getRestaurantCatalog.execute(restaurantId));
    }
}
