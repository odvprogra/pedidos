package com.nur.pedidos.identity.application;

import com.nur.pedidos.identity.domain.model.Role;

public record RegisterAccountCommand(String name, String email, String password, Role role) {

    @Override
    public String toString() {
        return "RegisterAccountCommand[name=%s, email=%s, role=%s]".formatted(name, email, role);
    }
}
