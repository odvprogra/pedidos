package com.nur.pedidos.identity.infrastructure.persistence;

import com.nur.pedidos.identity.domain.model.Role;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

interface AccountJpaRepository extends JpaRepository<AccountEntity, Long> {

    Optional<AccountEntity> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByRole(Role role);
}
