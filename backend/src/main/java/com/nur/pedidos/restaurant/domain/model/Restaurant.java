package com.nur.pedidos.restaurant.domain.model;

import com.nur.pedidos.restaurant.domain.exception.RestaurantSuspendedException;
import com.nur.pedidos.shared.domain.exception.DomainException;
import com.nur.pedidos.shared.domain.model.ImageUrls;
import java.time.Instant;
import lombok.Getter;

@Getter
public class Restaurant {

    private final Long id;
    private final Long ownerId;
    private String name;
    private String description;
    private String address;
    private RestaurantCategory category;
    private String imageUrl;
    private boolean open;
    private boolean suspended;
    private final Instant createdAt;

    public Restaurant(
            Long id,
            Long ownerId,
            String name,
            String description,
            String address,
            RestaurantCategory category,
            String imageUrl,
            boolean open,
            boolean suspended,
            Instant createdAt) {
        this.id = id;
        this.ownerId = ownerId;
        this.name = name;
        this.description = description;
        this.address = address;
        this.category = category;
        this.imageUrl = imageUrl;
        this.open = open;
        this.suspended = suspended;
        this.createdAt = createdAt;
    }

    public static Restaurant register(
            Long ownerId,
            String name,
            String description,
            String address,
            RestaurantCategory category,
            String imageUrl,
            Instant now) {
        Restaurant restaurant = new Restaurant(null, ownerId, null, null, null, null, null, false, false, now);
        restaurant.updateDetails(name, description, address, category, imageUrl);
        return restaurant;
    }

    public void updateDetails(
            String name, String description, String address, RestaurantCategory category, String imageUrl) {
        if (name == null || name.isBlank()) {
            throw new DomainException("restaurant.name_required", "El nombre del restaurante es obligatorio");
        }
        if (address == null || address.isBlank()) {
            throw new DomainException("restaurant.address_required", "La dirección del restaurante es obligatoria");
        }
        if (category == null) {
            throw new DomainException("restaurant.category_required", "La categoría del restaurante es obligatoria");
        }
        String validImageUrl = ImageUrls.normalize(imageUrl, "restaurant.invalid_image_url");
        this.name = name.strip();
        this.description = stripToNull(description);
        this.address = address.strip();
        this.category = category;
        this.imageUrl = validImageUrl;
    }

    public void open() {
        if (suspended) {
            throw new RestaurantSuspendedException();
        }
        this.open = true;
    }

    public void close() {
        this.open = false;
    }

    public void suspend() {
        this.suspended = true;
        this.open = false;
    }

    public void reactivate() {
        if (suspended) {
            this.suspended = false;
            this.open = false;
        }
    }

    public boolean isVisible() {
        return !suspended;
    }

    public boolean acceptsOrders() {
        return open && !suspended;
    }

    private static String stripToNull(String text) {
        return text == null || text.isBlank() ? null : text.strip();
    }
}
