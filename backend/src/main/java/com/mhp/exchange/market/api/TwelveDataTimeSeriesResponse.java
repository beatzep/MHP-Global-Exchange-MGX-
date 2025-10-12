package com.mhp.exchange.market.api;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class TwelveDataTimeSeriesResponse {
    @JsonProperty("values")
    private List<TwelveDataValue> values;

    @JsonProperty("status")
    private String status;

    public List<TwelveDataValue> getValues() { return values; }
    public String getStatus() { return status; }
}