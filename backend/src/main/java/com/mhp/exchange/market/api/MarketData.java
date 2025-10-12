package com.mhp.exchange.market.api;

public class MarketData {
    private final String symbol;
    private final double price;
    private final double change;
    private final double changePercent;

    public MarketData(String symbol, double price, double change, double changePercent) {
        this.symbol = symbol;
        this.price = price;
        this.change = change;
        this.changePercent = changePercent;
    }

    public String getSymbol() { return symbol; }
    public double getPrice() { return price; }
    public double getChange() {
        return change;
    }
    public double getChangePercent() {
        return changePercent;
    }
}