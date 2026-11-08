package com.nur.pedidos.order.domain.model;

import java.math.BigDecimal;

public record ProductSnapshot(Long id, String name, BigDecimal price, boolean available) {}
