package com.mhp.exchange.game.api;

import com.mhp.exchange.game.domain.GameScore;
import java.time.LocalDateTime;

public class LeaderboardEntry {
    private Long id;
    private String userName;
    private Integer score;
    private Integer totalRounds;
    private Integer timeTaken;
    private LocalDateTime playedAt;
    private Integer rank;

    public LeaderboardEntry() {}

    public LeaderboardEntry(GameScore gameScore, Integer rank) {
        this.id = gameScore.getId();
        this.userName = gameScore.getUserName();
        this.score = gameScore.getScore();
        this.totalRounds = gameScore.getTotalRounds();
        this.timeTaken = gameScore.getTimeTaken();
        this.playedAt = gameScore.getPlayedAt();
        this.rank = rank;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }

    public Integer getTotalRounds() {
        return totalRounds;
    }

    public void setTotalRounds(Integer totalRounds) {
        this.totalRounds = totalRounds;
    }

    public Integer getTimeTaken() {
        return timeTaken;
    }

    public void setTimeTaken(Integer timeTaken) {
        this.timeTaken = timeTaken;
    }

    public LocalDateTime getPlayedAt() {
        return playedAt;
    }

    public void setPlayedAt(LocalDateTime playedAt) {
        this.playedAt = playedAt;
    }

    public Integer getRank() {
        return rank;
    }

    public void setRank(Integer rank) {
        this.rank = rank;
    }
}
