package com.nur.pedidos.catalog.application;

public record RenameCategoryCommand(Long ownerId, Long categoryId, String name) {}
