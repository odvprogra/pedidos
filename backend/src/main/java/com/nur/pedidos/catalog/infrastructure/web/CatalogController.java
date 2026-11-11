package com.nur.pedidos.catalog.infrastructure.web;

import com.nur.pedidos.catalog.application.GetOwnCatalogUseCase;
import com.nur.pedidos.shared.infrastructure.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/restaurants/mine/catalog")
@RequiredArgsConstructor
class CatalogController {

    private final GetOwnCatalogUseCase getOwnCatalog;

    @GetMapping
    @PreAuthorize("hasRole('OWNER')")
    CatalogResponse mine(@AuthenticationPrincipal CurrentUser owner) {
        return CatalogResponse.from(getOwnCatalog.execute(owner.id()));
    }
}
