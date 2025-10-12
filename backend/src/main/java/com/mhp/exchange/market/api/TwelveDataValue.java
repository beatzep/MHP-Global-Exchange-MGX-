package com.mhp.exchange.market.api;

import com.fasterxml.jackson.annotation.JsonProperty;

public class TwelveDataValue {
    @JsonProperty("datetime")
    private String datetime;

    @JsonProperty("close")
    private String close;

    public String getDatetime() { return datetime; }
    public String getClose() { return close; }
}