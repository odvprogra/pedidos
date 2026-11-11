package com.nur.pedidos.identity.infrastructure.web;

import com.nur.pedidos.identity.application.RegisterAccountCommand;
import com.nur.pedidos.identity.domain.model.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

record RegisterAccountRequest(
        @NotBlank @Size(max = 100) String name,
        @NotBlank @Size(max = 254) String email,
        @NotEmpty String password,
        @NotNull @Pattern(regexp = "CUSTOMER|OWNER") String role) {

    RegisterAccountCommand toCommand() {
        return new RegisterAccountCommand(name, email, password, Role.valueOf(role));
    }

    @Override
    public String toString() {
        return "RegisterAccountRequest[name=%s, email=%s, role=%s]".formatted(name, email, role);
    }
}
