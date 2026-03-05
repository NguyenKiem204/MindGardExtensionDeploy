package com.kiemnv.MindGardAPI.repository;

import com.kiemnv.MindGardAPI.entity.LeaderboardEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LeaderboardRepository extends JpaRepository<LeaderboardEntry, Long> {

    /** Get all entries for a specific period key, sorted by rank */
    List<LeaderboardEntry> findByPeriodKeyOrderByRankAsc(String periodKey);

    /** Find a specific user's entry for a period key */
    Optional<LeaderboardEntry> findByPeriodKeyAndUserId(String periodKey, Long userId);

    /** Get entries for a period key, filtered by user IDs (for friends scope) */
    @Query("SELECT e FROM LeaderboardEntry e WHERE e.periodKey = :periodKey AND e.user.id IN :userIds ORDER BY e.rank ASC")
    List<LeaderboardEntry> findByPeriodKeyAndUserIdIn(@Param("periodKey") String periodKey, @Param("userIds") List<Long> userIds);

    /** Delete all entries for a specific period key (before recomputing) */
    @Modifying
    @Query("DELETE FROM LeaderboardEntry e WHERE e.periodKey = :periodKey")
    void deleteByPeriodKey(@Param("periodKey") String periodKey);

    // --- Legacy methods (kept for backward compat) ---
    Page<LeaderboardEntry> findByPeriod(String period, Pageable pageable);
}
