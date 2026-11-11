package com.nur.pedidos.identity.infrastructure.web;

import com.nur.pedidos.identity.application.LogInCommand;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

record LogInRequest(@NotBlank String email, @NotEmpty String password) {

    LogInCommand toCommand() {
        return new LogInCommand(email, password);
    }

    @Override
    public String toString() {
        return "LogInRequest[email=%s]".formatted(email);
    }
}
