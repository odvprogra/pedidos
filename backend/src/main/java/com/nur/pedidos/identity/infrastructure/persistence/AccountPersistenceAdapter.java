package com.nur.pedidos.identity.infrastructure.persistence;

import com.nur.pedidos.identity.domain.model.Account;
import com.nur.pedidos.identity.domain.model.Role;
import com.nur.pedidos.identity.domain.port.AccountRepository;
import com.nur.pedidos.shared.domain.model.PageResult;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
class AccountPersistenceAdapter implements AccountRepository {

    private final AccountJpaRepository jpaRepository;

    @Override
    public Account save(Account account) {
        return jpaRepository.save(AccountEntity.fromDomain(account)).toDomain();
    }

    @Override
    public Optional<Account> findById(Long id) {
        return jpaRepository.findById(id).map(AccountEntity::toDomain);
    }

    @Override
    public PageResult<Account> findPageInRegistrationOrder(int page, int size) {
        Page<AccountEntity> entities = jpaRepository.findAll(PageRequest.of(page, size, Sort.by("id")));
        return new PageResult<>(
                entities.map(AccountEntity::toDomain).getContent(), page, size, entities.getTotalElements());
    }

    @Override
    public Optional<Account> findByEmail(String email) {
        return jpaRepository.findByEmail(email).map(AccountEntity::toDomain);
    }

    @Override
    public boolean existsByEmail(String email) {
        return jpaRepository.existsByEmail(email);
    }

    @Override
    public boolean existsByRole(Role role) {
        return jpaRepository.existsByRole(role);
    }
}
