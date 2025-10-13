package com.mhp.exchange.trading.api;

import com.mhp.exchange.portfolio.domain.Position;
import com.mhp.exchange.portfolio.domain.PositionRepository;
import com.mhp.exchange.user.api.TokenService;
import com.mhp.exchange.user.domain.User;
import com.mhp.exchange.user.domain.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/trading")
@CrossOrigin(origins = "http://localhost:4200")
public class TradingController {

    @Autowired
    private TokenService tokenService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PositionRepository positionRepository;

    /**
     * Calculate trading fees based on category
     * Stocks and ETFs: 2 EUR
     * Bonds: 2 EUR + 0.5% of bond price
     */
    private double calculateFees(String category, double price, int quantity) {
        if ("bonds".equalsIgnoreCase(category)) {
            // Bonds: 2 EUR + 0.5% of total price
            return 2.0 + (price * quantity * 0.005);
        } else {
            // Stocks and ETFs: flat 2 EUR
            return 2.0;
        }
    }

    @PostMapping("/buy")
    public ResponseEntity<?> buyAsset(@RequestBody BuyRequest request,
                                      @RequestHeader("Authorization") String token) {
        try {
            // Validate token and get user
            String email = tokenService.getEmailFromToken(token);
            if (email == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid token"));
            }

            User user = userRepository.findByEmail(email).orElse(null);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found"));
            }

            // Validate request
            if (request.getQuantity() <= 0) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Quantity must be positive"));
            }

            if (request.getPrice() <= 0) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Price must be positive"));
            }

            // Calculate costs
            double fees = calculateFees(request.getCategory(), request.getPrice(), request.getQuantity());
            double assetCost = request.getPrice() * request.getQuantity();
            double totalCost = assetCost + fees;

            // Check if user has enough balance
            if (user.getBalance() < totalCost) {
                return ResponseEntity.badRequest()
                    .body(Map.of(
                        "error", "Insufficient funds",
                        "required", totalCost,
                        "available", user.getBalance(),
                        "fees", fees
                    ));
            }

            // Deduct from user balance
            user.setBalance(user.getBalance() - totalCost);
            userRepository.save(user);

            // Create position
            Position position = new Position(
                user.getId(),
                request.getSymbol(),
                request.getCategory(),
                request.getQuantity(),
                request.getPrice(),
                totalCost,
                fees
            );
            positionRepository.save(position);

            // Return success response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("symbol", request.getSymbol());
            response.put("quantity", request.getQuantity());
            response.put("price", request.getPrice());
            response.put("fees", fees);
            response.put("totalCost", totalCost);
            response.put("remainingBalance", user.getBalance());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to process purchase: " + e.getMessage()));
        }
    }

    @GetMapping("/positions")
    public ResponseEntity<?> getPositions(@RequestHeader("Authorization") String token) {
        try {
            // Validate token and get user
            String email = tokenService.getEmailFromToken(token);
            if (email == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid token"));
            }

            User user = userRepository.findByEmail(email).orElse(null);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found"));
            }

            // Get all positions for user
            List<Position> positions = positionRepository.findByUserId(user.getId());

            // Return positions with current balance
            Map<String, Object> response = new HashMap<>();
            response.put("positions", positions);
            response.put("balance", user.getBalance());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to fetch positions: " + e.getMessage()));
        }
    }

    @GetMapping("/balance")
    public ResponseEntity<?> getBalance(@RequestHeader("Authorization") String token) {
        try {
            // Validate token and get user
            String email = tokenService.getEmailFromToken(token);
            if (email == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid token"));
            }

            User user = userRepository.findByEmail(email).orElse(null);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found"));
            }

            return ResponseEntity.ok(Map.of("balance", user.getBalance()));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to fetch balance: " + e.getMessage()));
        }
    }
}
