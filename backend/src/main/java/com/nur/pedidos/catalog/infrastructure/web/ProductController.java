package com.nur.pedidos.catalog.infrastructure.web;

import com.nur.pedidos.catalog.application.CreateProductUseCase;
import com.nur.pedidos.catalog.application.DeleteProductUseCase;
import com.nur.pedidos.catalog.application.EditProductUseCase;
import com.nur.pedidos.catalog.application.MarkProductAvailableUseCase;
import com.nur.pedidos.catalog.application.MarkProductSoldOutUseCase;
import com.nur.pedidos.catalog.domain.model.Product;
import com.nur.pedidos.shared.infrastructure.security.CurrentUser;
import jakarta.validation.Valid;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ProductController.PRODUCTS)
@RequiredArgsConstructor
class ProductController {

    static final String PRODUCTS = "/api/v1/restaurants/mine/products";

    private final CreateProductUseCase createProduct;
    private final EditProductUseCase editProduct;
    private final DeleteProductUseCase deleteProduct;
    private final MarkProductSoldOutUseCase markProductSoldOut;
    private final MarkProductAvailableUseCase markProductAvailable;

    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    ResponseEntity<ProductResponse> create(
            @AuthenticationPrincipal CurrentUser owner, @Valid @RequestBody ProductRequest request) {
        Product product = createProduct.execute(request.toCreateCommand(owner.id()));
        return ResponseEntity.created(URI.create(PRODUCTS + "/" + product.getId()))
                .body(ProductResponse.from(product));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    ProductResponse edit(
            @AuthenticationPrincipal CurrentUser owner,
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request) {
        return ProductResponse.from(editProduct.execute(request.toEditCommand(owner.id(), id)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@AuthenticationPrincipal CurrentUser owner, @PathVariable Long id) {
        deleteProduct.execute(owner.id(), id);
    }

    @PostMapping("/{id}/mark-sold-out")
    @PreAuthorize("hasRole('OWNER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void markSoldOut(@AuthenticationPrincipal CurrentUser owner, @PathVariable Long id) {
        markProductSoldOut.execute(owner.id(), id);
    }

    @PostMapping("/{id}/mark-available")
    @PreAuthorize("hasRole('OWNER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void markAvailable(@AuthenticationPrincipal CurrentUser owner, @PathVariable Long id) {
        markProductAvailable.execute(owner.id(), id);
    }
}
