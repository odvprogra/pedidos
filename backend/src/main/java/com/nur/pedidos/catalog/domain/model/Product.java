package com.nur.pedidos.catalog.domain.model;

import com.nur.pedidos.shared.domain.exception.DomainException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import lombok.Getter;

@Getter
public class Product {

    private final Long id;
    private final Long restaurantId;
    private Long categoryId;
    private String name;
    private String description;
    private BigDecimal price;
    private boolean available;

    public Product(
            Long id,
            Long restaurantId,
            Long categoryId,
            String name,
            String description,
            BigDecimal price,
            boolean available) {
        this.id = id;
        this.restaurantId = restaurantId;
        this.categoryId = categoryId;
        this.name = name;
        this.description = description;
        this.price = price;
        this.available = available;
    }

    public static Product create(Category category, String name, String description, BigDecimal price) {
        return new Product(
                null,
                category.getRestaurantId(),
                category.getId(),
                requiredName(name),
                stripToNull(description),
                positivePrice(price),
                true);
    }

    public void edit(Category category, String name, String description, BigDecimal price) {
        String validName = requiredName(name);
        BigDecimal validPrice = positivePrice(price);
        this.name = validName;
        this.description = stripToNull(description);
        this.price = validPrice;
        this.categoryId = category.getId();
    }

    public void markSoldOut() {
        this.available = false;
    }

    public void markAvailable() {
        this.available = true;
    }

    public boolean belongsTo(Long restaurantId) {
        return this.restaurantId.equals(restaurantId);
    }

    private static String requiredName(String name) {
        if (name == null || name.isBlank()) {
            throw new DomainException("catalog.product_name_required", "El nombre del producto es obligatorio");
        }
        return name.strip();
    }

    private static BigDecimal positivePrice(BigDecimal price) {
        BigDecimal rounded = price == null ? null : price.setScale(2, RoundingMode.HALF_UP);
        if (rounded == null || rounded.signum() <= 0) {
            throw new DomainException("catalog.price_not_positive", "El precio tiene que ser mayor a cero");
        }
        return rounded;
    }

    private static String stripToNull(String text) {
        return text == null || text.isBlank() ? null : text.strip();
    }
}
