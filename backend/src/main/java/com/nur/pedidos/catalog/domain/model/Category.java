package com.nur.pedidos.catalog.domain.model;

import com.nur.pedidos.shared.domain.exception.DomainException;
import lombok.Getter;

@Getter
public class Category {

    private final Long id;
    private final Long restaurantId;
    private String name;

    public Category(Long id, Long restaurantId, String name) {
        this.id = id;
        this.restaurantId = restaurantId;
        this.name = name;
    }

    public static Category create(Long restaurantId, String name) {
        return new Category(null, restaurantId, requiredName(name));
    }

    public void rename(String name) {
        this.name = requiredName(name);
    }

    public boolean belongsTo(Long restaurantId) {
        return this.restaurantId.equals(restaurantId);
    }

    private static String requiredName(String name) {
        if (name == null || name.isBlank()) {
            throw new DomainException("catalog.category_name_required", "El nombre de la categoría es obligatorio");
        }
        return name.strip();
    }
}
