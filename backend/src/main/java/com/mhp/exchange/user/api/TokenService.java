package com.mhp.exchange.user.api;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class TokenService {
    // Store active tokens in memory (in production, use Redis or JWT)
    private final Map<String, String> activeTokens = new HashMap<>();

    public void storeToken(String token, String email) {
        activeTokens.put(token, email);
    }

    public String getEmailFromToken(String token) {
        return activeTokens.get(token);
    }

    public boolean isValidToken(String token) {
        return activeTokens.containsKey(token);
    }

    public void removeToken(String token) {
        activeTokens.remove(token);
    }
}
