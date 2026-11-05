package com.nur.pedidos.identity.domain.exception;

import com.nur.pedidos.shared.domain.exception.NotFoundException;

public class AccountNotFoundException extends NotFoundException {

    public AccountNotFoundException(Long id) {
        super("identity.not_found", "No existe la cuenta " + id);
    }
}
