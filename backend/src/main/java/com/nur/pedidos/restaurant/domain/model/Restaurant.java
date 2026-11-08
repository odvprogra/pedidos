package com.nur.pedidos.restaurant.domain.model;

import com.nur.pedidos.restaurant.domain.exception.RestaurantSuspendedException;
import com.nur.pedidos.shared.domain.exception.DomainException;
import java.time.Instant;
import lombok.Getter;

@Getter
public class Restaurant {

    private final Long id;
    private final Long ownerId;
    private final String name;
    private final String description;
    private final String address;
    private boolean open;
    private final boolean suspended;
    private final Instant createdAt;

    public Restaurant(
            Long id,
            Long ownerId,
            String name,
            String description,
            String address,
            boolean open,
            boolean suspended,
            Instant createdAt) {
        this.id = id;
        this.ownerId = ownerId;
        this.name = name;
        this.description = description;
        this.address = address;
        this.open = open;
        this.suspended = suspended;
        this.createdAt = createdAt;
    }

    public static Restaurant register(Long ownerId, String name, String description, String address, Instant now) {
        if (name == null || name.isBlank()) {
            throw new DomainException("restaurant.name_required", "El nombre del restaurante es obligatorio");
        }
        if (address == null || address.isBlank()) {
            throw new DomainException("restaurant.address_required", "La dirección del restaurante es obligatoria");
        }
        return new Restaurant(
                null, ownerId, name.strip(), stripToNull(description), address.strip(), false, false, now);
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
