package com.mhp.exchange.user.api;

import com.mhp.exchange.user.domain.User;
import com.mhp.exchange.user.domain.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/watchlist")
public class WatchlistController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TokenService tokenService;

    @GetMapping
    public ResponseEntity<?> getWatchlist(@RequestHeader("Authorization") String token) {
        String email = tokenService.getEmailFromToken(token);
        if (email == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Nicht authentifiziert"));
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Benutzer nicht gefunden"));
        }

        User user = userOpt.get();
        String watchlist = user.getWatchlist();

        // Parse watchlist with categories (format: symbol:category,symbol:category)
        Map<String, List<String>> categorizedWatchlist = new HashMap<>();
        categorizedWatchlist.put("stocks", new ArrayList<>());
        categorizedWatchlist.put("etfs", new ArrayList<>());
        categorizedWatchlist.put("bonds", new ArrayList<>());

        if (watchlist != null && !watchlist.isEmpty()) {
            String[] items = watchlist.split(",");
            for (String item : items) {
                String[] parts = item.split(":");
                if (parts.length == 2) {
                    String symbol = parts[0];
                    String category = parts[1];
                    categorizedWatchlist.computeIfAbsent(category, k -> new ArrayList<>()).add(symbol);
                } else if (parts.length == 1) {
                    // Backward compatibility: items without category go to stocks
                    categorizedWatchlist.get("stocks").add(parts[0]);
                }
            }
        }

        return ResponseEntity.ok(Map.of(
            "success", true,
            "watchlist", categorizedWatchlist
        ));
    }

    @PostMapping("/add")
    public ResponseEntity<?> addToWatchlist(
            @RequestHeader("Authorization") String token,
            @RequestBody Map<String, String> request) {

        String email = tokenService.getEmailFromToken(token);
        if (email == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Nicht authentifiziert"));
        }

        String symbol = request.get("symbol");
        String category = request.get("category");
        if (symbol == null || symbol.isEmpty()) {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", "Symbol fehlt"));
        }
        if (category == null || category.isEmpty()) {
            category = "stocks"; // Default to stocks
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Benutzer nicht gefunden"));
        }

        User user = userOpt.get();
        String watchlist = user.getWatchlist();
        Set<String> items = watchlist == null || watchlist.isEmpty()
            ? new HashSet<>()
            : new HashSet<>(Arrays.asList(watchlist.split(",")));

        // Check if symbol already exists (regardless of category)
        String itemToAdd = symbol + ":" + category;
        boolean symbolExists = items.stream().anyMatch(item -> item.startsWith(symbol + ":"));

        if (symbolExists) {
            // Parse and return categorized watchlist
            Map<String, List<String>> categorizedWatchlist = parseCategorizedWatchlist(watchlist);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Symbol bereits in Watchlist",
                "watchlist", categorizedWatchlist
            ));
        }

        items.add(itemToAdd);
        user.setWatchlist(String.join(",", items));
        userRepository.save(user);

        Map<String, List<String>> categorizedWatchlist = parseCategorizedWatchlist(user.getWatchlist());
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Zur Watchlist hinzugefügt",
            "watchlist", categorizedWatchlist
        ));
    }

    @PostMapping("/remove")
    public ResponseEntity<?> removeFromWatchlist(
            @RequestHeader("Authorization") String token,
            @RequestBody Map<String, String> request) {

        String email = tokenService.getEmailFromToken(token);
        if (email == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Nicht authentifiziert"));
        }

        String symbol = request.get("symbol");
        if (symbol == null || symbol.isEmpty()) {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", "Symbol fehlt"));
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Benutzer nicht gefunden"));
        }

        User user = userOpt.get();
        String watchlist = user.getWatchlist();
        Set<String> items = watchlist == null || watchlist.isEmpty()
            ? new HashSet<>()
            : new HashSet<>(Arrays.asList(watchlist.split(",")));

        // Remove all items that start with the symbol (removes regardless of category)
        items.removeIf(item -> item.startsWith(symbol + ":") || item.equals(symbol));
        user.setWatchlist(String.join(",", items));
        userRepository.save(user);

        Map<String, List<String>> categorizedWatchlist = parseCategorizedWatchlist(user.getWatchlist());
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Aus Watchlist entfernt",
            "watchlist", categorizedWatchlist
        ));
    }

    // Helper method to parse categorized watchlist
    private Map<String, List<String>> parseCategorizedWatchlist(String watchlist) {
        Map<String, List<String>> categorizedWatchlist = new HashMap<>();
        categorizedWatchlist.put("stocks", new ArrayList<>());
        categorizedWatchlist.put("etfs", new ArrayList<>());
        categorizedWatchlist.put("bonds", new ArrayList<>());

        if (watchlist != null && !watchlist.isEmpty()) {
            String[] items = watchlist.split(",");
            for (String item : items) {
                String[] parts = item.split(":");
                if (parts.length == 2) {
                    String symbol = parts[0];
                    String category = parts[1];
                    categorizedWatchlist.computeIfAbsent(category, k -> new ArrayList<>()).add(symbol);
                } else if (parts.length == 1) {
                    categorizedWatchlist.get("stocks").add(parts[0]);
                }
            }
        }

        return categorizedWatchlist;
    }
}
