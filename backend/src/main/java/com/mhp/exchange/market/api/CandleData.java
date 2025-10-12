package com.mhp.exchange.market.api;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public class CandleData {
    @JsonProperty("c")
    private List<Double> closePrices;

    @JsonProperty("t")
    private List<Long> timestamps;

    @JsonProperty("s")
    private String status;

    public List<Double> getClosePrices() {
        return closePrices;
    }

    public List<Long> getTimestamps() {
        return timestamps;
    }

    public String getStatus() {
        return status;
    }

    public void setClosePrices(List<Double> closePrices) {
        this.closePrices = closePrices;
    }

    public void setTimestamps(List<Long> timestamps) {
        this.timestamps = timestamps;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}