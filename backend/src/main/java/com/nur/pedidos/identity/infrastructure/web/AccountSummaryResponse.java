package com.nur.pedidos.identity.infrastructure.web;

import com.nur.pedidos.identity.domain.model.Account;
import com.nur.pedidos.identity.domain.model.Role;

record AccountSummaryResponse(Long id, String name, String email, Role role, boolean suspended) {

    static AccountSummaryResponse from(Account account) {
        return new AccountSummaryResponse(
                account.getId(), account.getName(), account.getEmail(), account.getRole(), account.isSuspended());
    }
}
