package com.mhp.exchange.game.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "game_scores")
public class GameScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String userEmail;

    @Column(nullable = false)
    private String userName;

    @Column(nullable = false)
    private Integer score;

    @Column(nullable = false)
    private Integer totalRounds;

    @Column(name = "played_at", nullable = false)
    private LocalDateTime playedAt;

    @Column(nullable = false)
    private Integer timeTaken; // in seconds

    @PrePersist
    protected void onCreate() {
        playedAt = LocalDateTime.now();
    }

    // Constructors
    public GameScore() {}

    public GameScore(String userEmail, String userName, Integer score, Integer totalRounds, Integer timeTaken) {
        this.userEmail = userEmail;
        this.userName = userName;
        this.score = score;
        this.totalRounds = totalRounds;
        this.timeTaken = timeTaken;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
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

    public LocalDateTime getPlayedAt() {
        return playedAt;
    }

    public void setPlayedAt(LocalDateTime playedAt) {
        this.playedAt = playedAt;
    }

    public Integer getTimeTaken() {
        return timeTaken;
    }

    public void setTimeTaken(Integer timeTaken) {
        this.timeTaken = timeTaken;
    }
}
