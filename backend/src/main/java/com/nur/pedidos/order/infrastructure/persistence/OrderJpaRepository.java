package com.nur.pedidos.order.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

interface OrderJpaRepository extends JpaRepository<OrderEntity, Long> {}
