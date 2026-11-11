package com.nur.pedidos.identity.application;

public record LogInCommand(String email, String password) {

    @Override
    public String toString() {
        return "LogInCommand[email=%s]".formatted(email);
    }
}
