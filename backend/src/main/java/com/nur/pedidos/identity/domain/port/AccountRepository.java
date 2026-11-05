package com.nur.pedidos.identity.domain.port;

import com.nur.pedidos.identity.domain.model.Account;
import com.nur.pedidos.identity.domain.model.Role;
import java.util.Optional;

public interface AccountRepository {

    Account save(Account account);

    Optional<Account> findById(Long id);

    Optional<Account> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByRole(Role role);
}
