package com.nur.pedidos.identity.application;

import com.nur.pedidos.identity.domain.model.Account;
import com.nur.pedidos.identity.domain.model.Role;
import com.nur.pedidos.identity.domain.port.AccountRepository;
import com.nur.pedidos.shared.domain.model.PageResult;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

class InMemoryAccountRepository implements AccountRepository {

    private final Map<Long, Account> accounts = new HashMap<>();
    private long sequence;

    @Override
    public Account save(Account account) {
        Long id = account.getId() != null ? account.getId() : ++sequence;
        Account saved = new Account(
                id,
                account.getName(),
                account.getEmail(),
                account.getPasswordHash(),
                account.getRole(),
                account.isSuspended(),
                account.getCreatedAt());
        accounts.put(id, saved);
        return saved;
    }

    @Override
    public Optional<Account> findById(Long id) {
        return Optional.ofNullable(accounts.get(id));
    }

    @Override
    public PageResult<Account> findPageInRegistrationOrder(int page, int size) {
        List<Account> items = accounts.values().stream()
                .sorted(Comparator.comparing(Account::getId))
                .skip((long) page * size)
                .limit(size)
                .toList();
        return new PageResult<>(items, page, size, accounts.size());
    }

    @Override
    public Optional<Account> findByEmail(String email) {
        return accounts.values().stream()
                .filter(account -> account.getEmail().equals(email))
                .findFirst();
    }

    @Override
    public boolean existsByEmail(String email) {
        return findByEmail(email).isPresent();
    }

    @Override
    public boolean existsByRole(Role role) {
        return accounts.values().stream().anyMatch(account -> account.getRole() == role);
    }

    int count() {
        return accounts.size();
    }
}
