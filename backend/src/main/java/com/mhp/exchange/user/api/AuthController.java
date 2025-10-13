package com.mhp.exchange.user.api;

import com.mhp.exchange.user.domain.User;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    // In-Memory User Store (for demo purposes)
    private final Map<String, User> users = new HashMap<>();

    public AuthController() {
        // Demo users
        users.put("demo@mhp.com", new User(
            UUID.randomUUID().toString(),
            "demo@mhp.com",
            "demo123",
            "Demo User"
        ));
        users.put("admin@mhp.com", new User(
            UUID.randomUUID().toString(),
            "admin@mhp.com",
            "admin123",
            "Admin User"
        ));
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        User user = users.get(request.getEmail());

        if (user == null) {
            return new LoginResponse(false, "Benutzer nicht gefunden");
        }

        if (!user.getPassword().equals(request.getPassword())) {
            return new LoginResponse(false, "Falsches Passwort");
        }

        // Generate simple token (in production, use JWT)
        String token = UUID.randomUUID().toString();

        return new LoginResponse(true, token, user.getEmail(), user.getName());
    }

    @PostMapping("/register")
    public LoginResponse register(@RequestBody RegisterRequest request) {
        if (users.containsKey(request.getEmail())) {
            return new LoginResponse(false, "E-Mail bereits registriert");
        }

        User newUser = new User(
            UUID.randomUUID().toString(),
            request.getEmail(),
            request.getPassword(),
            request.getName()
        );

        users.put(request.getEmail(), newUser);

        String token = UUID.randomUUID().toString();
        return new LoginResponse(true, token, newUser.getEmail(), newUser.getName());
    }

    @GetMapping("/validate")
    public Map<String, Boolean> validateToken(@RequestHeader("Authorization") String token) {
        Map<String, Boolean> response = new HashMap<>();
        // Simple validation (in production, validate JWT)
        response.put("valid", token != null && !token.isEmpty());
        return response;
    }
}
