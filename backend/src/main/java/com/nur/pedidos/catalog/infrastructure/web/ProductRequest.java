package com.nur.pedidos.catalog.infrastructure.web;

import com.nur.pedidos.catalog.application.CreateProductCommand;
import com.nur.pedidos.catalog.application.EditProductCommand;
import com.nur.pedidos.shared.domain.model.ImageUrls;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

record ProductRequest(
        @NotNull Long categoryId,
        @NotBlank @Size(max = 120) String name,
        @Size(max = 300) String description,

        @NotNull @Positive @Digits(integer = 10, fraction = 2) BigDecimal price,

        @Size(max = ImageUrls.MAX_LENGTH) String imageUrl) {

    CreateProductCommand toCreateCommand(Long ownerId) {
        return new CreateProductCommand(ownerId, categoryId, name, description, price, imageUrl);
    }

    EditProductCommand toEditCommand(Long ownerId, Long productId) {
        return new EditProductCommand(ownerId, productId, categoryId, name, description, price, imageUrl);
    }
}
