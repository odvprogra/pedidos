package com.nur.pedidos.identity.infrastructure.startup;

import com.nur.pedidos.identity.application.CreateAdminCommand;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.StringUtils;

@ConfigurationProperties("pedidos.admin")
record AdminProperties(String email, String password) {

    boolean isMissing() {
        return !StringUtils.hasText(email) && !StringUtils.hasText(password);
    }

    CreateAdminCommand toCommand() {
        return new CreateAdminCommand(email, password);
    }

    @Override
    public String toString() {
        return "AdminProperties[email=%s]".formatted(email);
    }
}
