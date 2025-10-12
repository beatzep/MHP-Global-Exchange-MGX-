package com.mhp.exchange.market;

public class MarketData {
    private String symbol;
    private double price;

    public MarketData(String symbol, double price) {
        this.symbol = symbol;
        this.price = price;
    }

    public String getSymbol() { return symbol; }
    public double getPrice() { return price; }
}
