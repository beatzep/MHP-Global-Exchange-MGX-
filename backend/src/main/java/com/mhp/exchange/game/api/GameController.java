package com.mhp.exchange.game.api;

import com.mhp.exchange.game.domain.GameScore;
import com.mhp.exchange.game.domain.GameScoreRepository;
import com.mhp.exchange.market.api.CandleData;
import com.mhp.exchange.market.api.TwelveDataTimeSeriesResponse;
import com.mhp.exchange.user.api.TokenService;
import com.mhp.exchange.user.domain.User;
import com.mhp.exchange.user.domain.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/game")
public class GameController {

    @Value("${twelvedata.api.key}")
    private String twelveDataApiKey;

    @Autowired
    private GameScoreRepository gameScoreRepository;

    @Autowired
    private TokenService tokenService;

    @Autowired
    private UserRepository userRepository;

    // Pool of stocks for the game
    private static final List<String> STOCK_POOL = List.of(
        "AAPL", "GOOGL", "TSLA", "MSFT", "AMZN",
        "NVDA", "META", "NFLX", "AMD", "INTC",
        "JPM", "BAC", "WMT", "DIS", "PYPL",
        "V", "MA", "ADBE", "CRM", "ORCL"
    );

    @GetMapping("/guess-the-chart")
    public Mono<GameResponse> getGuessTheChartGame(@RequestParam(defaultValue = "4") int rounds) {
        Random random = new Random();

        // Select random stocks for the game
        List<String> selectedStocks = new ArrayList<>(STOCK_POOL);
        Collections.shuffle(selectedStocks, random);
        selectedStocks = selectedStocks.subList(0, Math.min(rounds, selectedStocks.size()));

        // Create a list of Mono for all chart data requests
        List<Mono<GameRound>> roundMonos = new ArrayList<>();

        for (String correctSymbol : selectedStocks) {
            // Get 3 other random stocks for wrong answers
            List<String> wrongAnswers = new ArrayList<>(STOCK_POOL);
            wrongAnswers.remove(correctSymbol);
            Collections.shuffle(wrongAnswers, random);
            wrongAnswers = wrongAnswers.subList(0, 3);

            // Combine correct and wrong answers
            List<String> allOptions = new ArrayList<>(wrongAnswers);
            allOptions.add(correctSymbol);
            Collections.shuffle(allOptions, random);

            // Fetch chart data for the correct symbol
            Mono<GameRound> roundMono = getChartData(correctSymbol)
                .map(chartData -> {
                    GameRound round = new GameRound();
                    round.setSymbol(correctSymbol);
                    round.setChartData(chartData);
                    round.setOptions(allOptions);
                    round.setCorrectAnswer(correctSymbol);
                    return round;
                });

            roundMonos.add(roundMono);
        }

        // Combine all rounds into a single response
        return Flux.concat(roundMonos)
            .collectList()
            .map(gameRounds -> {
                GameResponse response = new GameResponse();
                response.setRounds(gameRounds);
                return response;
            });
    }

    private Mono<CandleData> getChartData(String symbol) {
        String twelveDataUrl = "https://api.twelvedata.com/time_series";

        return WebClient.create(twelveDataUrl).get()
            .uri(uriBuilder -> uriBuilder
                .queryParam("symbol", symbol)
                .queryParam("interval", "1day")
                .queryParam("outputsize", 90) // ca. 3 months
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
                        } catch (ParseException | NumberFormatException e) {
                            // ignore faulty entries
                        }
                    });

                    Collections.reverse(timestamps); // API returns data in descending order
                    Collections.reverse(prices);

                    candleData.setClosePrices(prices);
                    candleData.setTimestamps(timestamps);
                    candleData.setStatus("ok");
                }
                return candleData;
            });
    }

    @PostMapping("/submit-score")
    public ResponseEntity<?> submitScore(
            @RequestHeader(value = "Authorization", required = false) String token,
            @RequestBody SubmitScoreRequest request) {

        // Check if user is authenticated
        if (token == null || token.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Nicht authentifiziert"));
        }

        String email = tokenService.getEmailFromToken(token);
        if (email == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Ungültiger Token"));
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Benutzer nicht gefunden"));
        }

        User user = userOpt.get();

        // Save score
        GameScore gameScore = new GameScore(
            user.getEmail(),
            user.getName(),
            request.getScore(),
            request.getTotalRounds(),
            request.getTimeTaken()
        );

        gameScoreRepository.save(gameScore);

        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Score gespeichert!",
            "scoreId", gameScore.getId()
        ));
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<List<LeaderboardEntry>> getLeaderboard(@RequestParam(defaultValue = "10") int limit) {
        List<GameScore> topScores = gameScoreRepository.findTopScores();

        // Limit results
        if (topScores.size() > limit) {
            topScores = topScores.subList(0, limit);
        }

        // Convert to LeaderboardEntry with ranks
        List<LeaderboardEntry> leaderboard = new ArrayList<>();
        for (int i = 0; i < topScores.size(); i++) {
            leaderboard.add(new LeaderboardEntry(topScores.get(i), i + 1));
        }

        return ResponseEntity.ok(leaderboard);
    }

    @GetMapping("/my-scores")
    public ResponseEntity<?> getMyScores(@RequestHeader(value = "Authorization", required = false) String token) {
        // Check if user is authenticated
        if (token == null || token.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Nicht authentifiziert"));
        }

        String email = tokenService.getEmailFromToken(token);
        if (email == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Ungültiger Token"));
        }

        List<GameScore> userScores = gameScoreRepository.findByUserEmailOrderByPlayedAtDesc(email);

        return ResponseEntity.ok(userScores);
    }
}
