package com.nur.pedidos.shared.domain.exception;

public class UnauthenticatedException extends DomainException {

    public UnauthenticatedException(String code, String message) {
        super(code, message);
    }
}
