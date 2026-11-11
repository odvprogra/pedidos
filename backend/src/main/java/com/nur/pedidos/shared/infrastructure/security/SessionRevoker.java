package com.nur.pedidos.shared.infrastructure.security;

import lombok.RequiredArgsConstructor;
import org.springframework.session.FindByIndexNameSessionRepository;
import org.springframework.session.Session;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SessionRevoker {

    private final FindByIndexNameSessionRepository<? extends Session> sessionRepository;

    public void revokeAll(Long userId) {
        sessionRepository.findByPrincipalName(String.valueOf(userId)).keySet().forEach(sessionRepository::deleteById);
    }
}
