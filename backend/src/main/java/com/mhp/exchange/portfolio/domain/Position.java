package com.mhp.exchange.portfolio.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "positions")
public class Position {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String symbol;

    @Column(nullable = false)
    private String category; // stocks, etfs, bonds

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "purchase_price", nullable = false)
    private Double purchasePrice; // Price per unit in EUR

    @Column(name = "total_cost", nullable = false)
    private Double totalCost; // Including fees

    @Column(nullable = false)
    private Double fees; // Transaction fees paid

    @Column(name = "purchase_date", nullable = false)
    private LocalDateTime purchaseDate;

    @PrePersist
    protected void onCreate() {
        purchaseDate = LocalDateTime.now();
    }

    public Position() {}

    public Position(Long userId, String symbol, String category, Integer quantity,
                   Double purchasePrice, Double totalCost, Double fees) {
        this.userId = userId;
        this.symbol = symbol;
        this.category = category;
        this.quantity = quantity;
        this.purchasePrice = purchasePrice;
        this.totalCost = totalCost;
        this.fees = fees;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getSymbol() { return symbol; }
    public void setSymbol(String symbol) { this.symbol = symbol; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public Double getPurchasePrice() { return purchasePrice; }
    public void setPurchasePrice(Double purchasePrice) { this.purchasePrice = purchasePrice; }

    public Double getTotalCost() { return totalCost; }
    public void setTotalCost(Double totalCost) { this.totalCost = totalCost; }

    public Double getFees() { return fees; }
    public void setFees(Double fees) { this.fees = fees; }

    public LocalDateTime getPurchaseDate() { return purchaseDate; }
    public void setPurchaseDate(LocalDateTime purchaseDate) { this.purchaseDate = purchaseDate; }
}
