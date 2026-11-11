package com.nur.pedidos.identity.domain.port;

public interface PasswordHasher {

    String hash(String password);

    boolean matches(String password, String hash);
}
