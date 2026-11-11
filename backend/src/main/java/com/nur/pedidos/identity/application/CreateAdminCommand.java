package com.nur.pedidos.identity.application;

public record CreateAdminCommand(String email, String password) {

    @Override
    public String toString() {
        return "CreateAdminCommand[email=%s]".formatted(email);
    }
}
