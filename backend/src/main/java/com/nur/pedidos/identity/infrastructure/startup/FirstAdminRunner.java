package com.nur.pedidos.identity.infrastructure.startup;

import com.nur.pedidos.identity.application.CreateAdminUseCase;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
@EnableConfigurationProperties(AdminProperties.class)
class FirstAdminRunner implements ApplicationRunner {

    private final AdminProperties admin;
    private final CreateAdminUseCase createAdmin;

    @Override
    public void run(ApplicationArguments args) {
        if (admin.isMissing()) {
            log.warn("No se creó la cuenta de administrador: faltan ADMIN_EMAIL y ADMIN_PASSWORD");
            return;
        }
        createAdmin.execute(admin.toCommand());
    }
}
