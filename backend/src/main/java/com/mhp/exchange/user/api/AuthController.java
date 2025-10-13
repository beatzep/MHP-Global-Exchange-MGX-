package com.mhp.exchange.user.api;

import com.mhp.exchange.user.domain.User;
import com.mhp.exchange.user.domain.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private TokenService tokenService;

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());

        if (userOpt.isEmpty()) {
            return new LoginResponse(false, "Benutzer nicht gefunden");
        }

        User user = userOpt.get();

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return new LoginResponse(false, "Falsches Passwort");
        }

        // Generate simple token
        String token = UUID.randomUUID().toString();
        tokenService.storeToken(token, user.getEmail());

        return new LoginResponse(true, token, user.getEmail(), user.getName());
    }

    @PostMapping("/register")
    public LoginResponse register(@RequestBody RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return new LoginResponse(false, "E-Mail bereits registriert");
        }

        // Hash password with BCrypt
        String hashedPassword = passwordEncoder.encode(request.getPassword());

        User newUser = new User(request.getEmail(), hashedPassword, request.getName());
        userRepository.save(newUser);

        String token = UUID.randomUUID().toString();
        tokenService.storeToken(token, newUser.getEmail());

        return new LoginResponse(true, token, newUser.getEmail(), newUser.getName());
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestHeader("Authorization") String token,
            @RequestBody ChangePasswordRequest request) {

        String email = tokenService.getEmailFromToken(token);
        if (email == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Nicht authentifiziert"));
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Benutzer nicht gefunden"));
        }

        User user = userOpt.get();

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", "Aktuelles Passwort ist falsch"));
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("success", true, "message", "Passwort erfolgreich geändert"));
    }

    @PostMapping("/update-profile")
    public ResponseEntity<?> updateProfile(
            @RequestHeader("Authorization") String token,
            @RequestBody UpdateProfileRequest request) {

        String email = tokenService.getEmailFromToken(token);
        if (email == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Nicht authentifiziert"));
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Benutzer nicht gefunden"));
        }

        User user = userOpt.get();

        if (request.getName() != null && !request.getName().isEmpty()) {
            user.setName(request.getName());
        }

        if (request.getEmail() != null && !request.getEmail().isEmpty() && !request.getEmail().equals(email)) {
            if (userRepository.existsByEmail(request.getEmail())) {
                return ResponseEntity.status(400).body(Map.of("success", false, "message", "E-Mail bereits vergeben"));
            }
            user.setEmail(request.getEmail());
            // Update token mapping
            tokenService.storeToken(token, request.getEmail());
        }

        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Profil erfolgreich aktualisiert",
            "user", Map.of(
                "email", user.getEmail(),
                "name", user.getName()
            )
        ));
    }

    @GetMapping("/validate")
    public Map<String, Boolean> validateToken(@RequestHeader("Authorization") String token) {
        Map<String, Boolean> response = new HashMap<>();
        response.put("valid", tokenService.isValidToken(token));
        return response;
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader("Authorization") String token) {
        tokenService.removeToken(token);
        return ResponseEntity.ok(Map.of("success", true, "message", "Erfolgreich abgemeldet"));
    }
}
