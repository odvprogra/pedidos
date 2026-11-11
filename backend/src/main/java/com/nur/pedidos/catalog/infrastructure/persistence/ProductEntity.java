package com.nur.pedidos.catalog.infrastructure.persistence;

import com.nur.pedidos.catalog.domain.model.Product;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
class ProductEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long restaurantId;

    @Column(nullable = false)
    private Long categoryId;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 300)
    private String description;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private boolean available;

    @Column(length = 500)
    private String imageUrl;

    static ProductEntity fromDomain(Product product) {
        ProductEntity entity = new ProductEntity();
        entity.setId(product.getId());
        entity.setRestaurantId(product.getRestaurantId());
        entity.setCategoryId(product.getCategoryId());
        entity.setName(product.getName());
        entity.setDescription(product.getDescription());
        entity.setPrice(product.getPrice());
        entity.setImageUrl(product.getImageUrl());
        entity.setAvailable(product.isAvailable());
        return entity;
    }

    Product toDomain() {
        return new Product(id, restaurantId, categoryId, name, description, price, available, imageUrl);
    }
}
