package com.nur.pedidos.restaurant.infrastructure.persistence;

import com.nur.pedidos.restaurant.domain.model.Restaurant;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "restaurants")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
class RestaurantEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long ownerId;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 300)
    private String description;

    @Column(nullable = false, length = 200)
    private String address;

    @Column(nullable = false)
    private boolean open;

    @Column(nullable = false)
    private boolean suspended;

    @Column(nullable = false)
    private Instant createdAt;

    static RestaurantEntity fromDomain(Restaurant restaurant) {
        RestaurantEntity entity = new RestaurantEntity();
        entity.setId(restaurant.getId());
        entity.setOwnerId(restaurant.getOwnerId());
        entity.setName(restaurant.getName());
        entity.setDescription(restaurant.getDescription());
        entity.setAddress(restaurant.getAddress());
        entity.setOpen(restaurant.isOpen());
        entity.setSuspended(restaurant.isSuspended());
        entity.setCreatedAt(restaurant.getCreatedAt());
        return entity;
    }

    Restaurant toDomain() {
        return new Restaurant(id, ownerId, name, description, address, open, suspended, createdAt);
    }
}
