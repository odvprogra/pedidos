package com.nur.pedidos.order.infrastructure.persistence;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

interface OrderJpaRepository extends JpaRepository<OrderEntity, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<OrderEntity> findForUpdateById(Long id);

    Page<OrderEntity> findAllByCustomerId(Long customerId, Pageable pageable);
}
