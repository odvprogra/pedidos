package com.nur.pedidos.identity.domain.exception;

import com.nur.pedidos.shared.domain.exception.UnauthenticatedException;

public class InvalidCredentialsException extends UnauthenticatedException {

    public InvalidCredentialsException() {
        super("identity.invalid_credentials", "El correo o la contraseña no son correctos");
    }
}
