package com.nur.pedidos.order.infrastructure.persistence;

import com.nur.pedidos.order.domain.model.OrderItem;
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
@Table(name = "order_items")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
class OrderItemEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long productId;

    @Column(nullable = false, length = 120)
    private String productName;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Column(nullable = false)
    private int quantity;

    static OrderItemEntity fromDomain(OrderItem item) {
        OrderItemEntity entity = new OrderItemEntity();
        entity.setId(item.id());
        entity.setProductId(item.productId());
        entity.setProductName(item.productName());
        entity.setUnitPrice(item.unitPrice());
        entity.setQuantity(item.quantity());
        return entity;
    }

    OrderItem toDomain() {
        return new OrderItem(id, productId, productName, unitPrice, quantity);
    }
}
