package com.mhp.exchange.game.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GameScoreRepository extends JpaRepository<GameScore, Long> {

    // Get top scores ordered by score (desc), then by time taken (asc)
    @Query("SELECT g FROM GameScore g ORDER BY g.score DESC, g.timeTaken ASC, g.playedAt DESC")
    List<GameScore> findTopScores();

    // Get user's best score
    @Query("SELECT g FROM GameScore g WHERE g.userEmail = ?1 ORDER BY g.score DESC, g.timeTaken ASC LIMIT 1")
    GameScore findBestScoreByUser(String userEmail);

    // Get all scores by user
    List<GameScore> findByUserEmailOrderByPlayedAtDesc(String userEmail);
}
