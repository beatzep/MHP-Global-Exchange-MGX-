package com.mhp.exchange.game.api;

import java.util.List;

public class GameResponse {
    private List<GameRound> rounds;

    public List<GameRound> getRounds() {
        return rounds;
    }

    public void setRounds(List<GameRound> rounds) {
        this.rounds = rounds;
    }
}
