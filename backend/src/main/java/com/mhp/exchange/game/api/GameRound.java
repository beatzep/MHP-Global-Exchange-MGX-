package com.mhp.exchange.game.api;

import com.mhp.exchange.market.api.CandleData;
import java.util.List;

public class GameRound {
    private String symbol;
    private CandleData chartData;
    private List<String> options;
    private String correctAnswer;

    public String getSymbol() {
        return symbol;
    }

    public void setSymbol(String symbol) {
        this.symbol = symbol;
    }

    public CandleData getChartData() {
        return chartData;
    }

    public void setChartData(CandleData chartData) {
        this.chartData = chartData;
    }

    public List<String> getOptions() {
        return options;
    }

    public void setOptions(List<String> options) {
        this.options = options;
    }

    public String getCorrectAnswer() {
        return correctAnswer;
    }

    public void setCorrectAnswer(String correctAnswer) {
        this.correctAnswer = correctAnswer;
    }
}
