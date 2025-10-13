package com.mhp.exchange.trading.api;

public class BuyRequest {
    private String symbol;
    private String category; // stocks, etfs, bonds
    private Integer quantity;
    private Double price;

    public BuyRequest() {}

    public BuyRequest(String symbol, String category, Integer quantity, Double price) {
        this.symbol = symbol;
        this.category = category;
        this.quantity = quantity;
        this.price = price;
    }

    public String getSymbol() { return symbol; }
    public void setSymbol(String symbol) { this.symbol = symbol; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }
}
