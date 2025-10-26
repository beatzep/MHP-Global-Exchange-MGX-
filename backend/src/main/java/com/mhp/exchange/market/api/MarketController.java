package com.mhp.exchange.market.api;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/market")
public class MarketController {
    @Value("${finnhub.api.key}")
    private String finnhubApiKey;
    @Value("${finnhub.api.key2:}")
    private String finnhubApiKey2;
    @Value("${twelvedata.api.key}")
    private String twelveDataApiKey;
    private final WebClient webClient;
    private int requestCounter = 0;

    public MarketController(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.baseUrl("https://finnhub.io/api/v1").build();
    }

    /**
     * Load balancing zwischen zwei API Keys
     */
    private synchronized String getNextApiKey() {
        // Wenn kein zweiter Key vorhanden ist, immer den ersten nutzen
        if (finnhubApiKey2 == null || finnhubApiKey2.isEmpty()) {
            return finnhubApiKey;
        }
        // Alternierend zwischen beiden Keys wechseln
        requestCounter++;
        return (requestCounter % 2 == 0) ? finnhubApiKey : finnhubApiKey2;
    }

    @GetMapping
    public String getMarketMessage() {
        return "Hello from Spring Boot Huanon 👋";
    }

    @GetMapping("/prices")
    public Flux<MarketData> getPrices() {
        return getPricesByCategory("stocks");
    }

    @GetMapping("/prices/{category}")
    public Flux<MarketData> getPricesByCategory(@PathVariable String category) {
        List<String> symbols;

        switch (category.toLowerCase()) {
            case "etfs":
                symbols = List.of("SPY", "QQQ", "VTI", "IWM", "EFA", "VWO", "AGG", "GLD");
                break;
            case "bonds":
                symbols = List.of("TLT", "IEF", "SHY", "LQD", "HYG", "MUB", "TIP", "BND");
                break;
            case "stocks":
            default:
                symbols = List.of(
                    "AAPL", "GOOGL", "TSLA", "MSFT", "AMZN",
                    "NVDA", "META", "NFLX", "AMD", "INTC"
                );
        }

        // Mit 2 API Keys: Optimiert für schnelles Laden ohne Rate Limit
        // 450ms Verzögerung + 2 parallel = ~2.2 Requests/Sekunde (1.1 pro Key)
        return Flux.fromIterable(symbols)
                .delayElements(Duration.ofMillis(450))  // 450ms zwischen Requests
                .flatMap(this::fetchStockData, 2);      // max 2 parallel
    }

    private Mono<MarketData> fetchStockData(String symbol) {
        String apiKey = getNextApiKey();
        return webClient.get()
                .uri(uriBuilder -> uriBuilder.path("/quote")
                        .queryParam("symbol", symbol)
                        .queryParam("token", apiKey)
                        .build())
                .retrieve()
                .bodyToMono(FinnhubQuote.class)
                .map(quote -> quote.toMarketData(symbol))
                .onErrorResume(e -> { // Fehler bei einzelnen Abfragen behandeln
                    System.err.println("Could not fetch data for symbol: " + symbol + ", Error: " + e.getMessage());
                    return Mono.empty(); // Bei Fehler einfach überspringen
                });
    }

    @GetMapping("/candles/{symbol}")
    public Mono<CandleData> getStockCandles(@PathVariable String symbol) {
        String twelveDataUrl = "https://api.twelvedata.com/time_series";

        return WebClient.create(twelveDataUrl).get()
                .uri(uriBuilder -> uriBuilder
                        .queryParam("symbol", symbol)
                        .queryParam("interval", "1day")
                        .queryParam("outputsize", 90) // ca. 3 Monate
                        .queryParam("apikey", twelveDataApiKey)
                        .build())
                .retrieve()
                .bodyToMono(TwelveDataTimeSeriesResponse.class)
                .map(response -> {
                    CandleData candleData = new CandleData();
                    if (response != null && "ok".equals(response.getStatus()) && response.getValues() != null) {
                        List<Double> prices = new ArrayList<>();
                        List<Long> timestamps = new ArrayList<>();
                        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");

                        response.getValues().forEach(value -> {
                            try {
                                timestamps.add(sdf.parse(value.getDatetime()).getTime() / 1000);
                                prices.add(Double.parseDouble(value.getClose()));
                            } catch (ParseException | NumberFormatException e) { /* ignore faulty entries */ }
                        });

                        Collections.reverse(timestamps); // API liefert Daten absteigend
                        Collections.reverse(prices);

                        candleData.setClosePrices(prices);
                        candleData.setTimestamps(timestamps);
                        candleData.setStatus("ok");
                    }
                    return candleData;
                });
    }
}
