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
    @Value("${twelvedata.api.key}")
    private String twelveDataApiKey;
    private final WebClient webClient;

    public MarketController(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.baseUrl("https://finnhub.io/api/v1").build();
    }

    @GetMapping
    public String getMarketMessage() {
        return "Hello from Spring Boot Huanon 👋";
    }

    @GetMapping("/prices")
    public Flux<MarketData> getPrices() {
        List<String> symbols = List.of("AAPL", "GOOGL", "TSLA", "MSFT", "AMZN", "NVDA", "VOW3.DE");
        return Flux.fromIterable(symbols)
                // Nicht-blockierende Verzögerung, um das API-Limit nicht zu überschreiten
                .delayElements(Duration.ofSeconds(2))
                .flatMap(this::fetchStockData);
    }

    private Mono<MarketData> fetchStockData(String symbol) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder.path("/quote")
                        .queryParam("symbol", symbol)
                        .queryParam("token", finnhubApiKey)
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
