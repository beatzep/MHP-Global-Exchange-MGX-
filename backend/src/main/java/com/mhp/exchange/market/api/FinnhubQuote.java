package com.mhp.exchange.market.api;

import com.fasterxml.jackson.annotation.JsonProperty;

public class FinnhubQuote {
    @JsonProperty("c")
    private double currentPrice;

    @JsonProperty("d")
    private double change;

    @JsonProperty("dp")
    private double percentChange;

    public double getCurrentPrice() {
        return currentPrice;
    }

    public double getChange() {
        return change;
    }

    public double getPercentChange() {
        return percentChange;
    }

    public MarketData toMarketData(String symbol) {
        return new MarketData(symbol, this.currentPrice, this.change, this.percentChange);
    }
}