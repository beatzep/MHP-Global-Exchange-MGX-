package com.mhp.exchange.market;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/market")
public class MarketController {

    @GetMapping("/prices")
    public List<MarketData> getPrices() {
        return List.of(
            new MarketData("AAPL", 172.35),
            new MarketData("GOOGL", 134.12),
            new MarketData("TSLA", 255.41)
        );
    }
}
