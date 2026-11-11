package com.nur.pedidos.identity.domain.exception;

import com.nur.pedidos.shared.domain.exception.ConflictException;

public class EmailTakenException extends ConflictException {

    public EmailTakenException() {
        super("identity.email_taken", "Ya existe una cuenta con ese correo");
    }
}
