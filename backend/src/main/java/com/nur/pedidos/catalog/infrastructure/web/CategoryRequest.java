package com.nur.pedidos.catalog.infrastructure.web;

import com.nur.pedidos.catalog.application.CreateCategoryCommand;
import com.nur.pedidos.catalog.application.RenameCategoryCommand;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

record CategoryRequest(@NotBlank @Size(max = 60) String name) {

    CreateCategoryCommand toCreateCommand(Long ownerId) {
        return new CreateCategoryCommand(ownerId, name);
    }

    RenameCategoryCommand toRenameCommand(Long ownerId, Long categoryId) {
        return new RenameCategoryCommand(ownerId, categoryId, name);
    }
}
