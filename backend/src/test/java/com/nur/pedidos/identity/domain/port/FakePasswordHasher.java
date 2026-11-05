package com.nur.pedidos.identity.domain.port;

public class FakePasswordHasher implements PasswordHasher {

    private static final String PREFIX = "hashed:";

    @Override
    public String hash(String password) {
        return PREFIX + password;
    }

    @Override
    public boolean matches(String password, String hash) {
        return hash.equals(PREFIX + password);
    }
}
