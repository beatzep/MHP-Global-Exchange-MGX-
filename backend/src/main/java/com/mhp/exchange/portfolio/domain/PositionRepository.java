package com.mhp.exchange.portfolio.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PositionRepository extends JpaRepository<Position, Long> {
    List<Position> findByUserId(Long userId);
    List<Position> findByUserIdAndSymbol(Long userId, String symbol);
}
