package com.kiemnv.MindGardAPI.repository;

import com.kiemnv.MindGardAPI.entity.LeaderboardEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeaderboardRepository extends JpaRepository<LeaderboardEntry, Long> {
    Page<LeaderboardEntry> findByPeriod(String period, Pageable pageable);
    List<LeaderboardEntry> findByPeriodOrderByScoreDesc(String period);
}
