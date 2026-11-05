package com.nur.pedidos.identity.infrastructure.web;

import com.nur.pedidos.identity.domain.model.Account;
import com.nur.pedidos.identity.domain.model.Role;

record AccountResponse(Long id, String name, String email, Role role) {

    static AccountResponse from(Account account) {
        return new AccountResponse(account.getId(), account.getName(), account.getEmail(), account.getRole());
    }
}
