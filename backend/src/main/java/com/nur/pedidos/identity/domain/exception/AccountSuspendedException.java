package com.nur.pedidos.identity.domain.exception;

import com.nur.pedidos.shared.domain.exception.ForbiddenException;

public class AccountSuspendedException extends ForbiddenException {

    public AccountSuspendedException() {
        super("identity.account_suspended", "La cuenta está suspendida");
    }
}
