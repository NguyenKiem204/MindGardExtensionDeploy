package com.kiemnv.MindGardAPI.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "leaderboard_entries",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "period_key"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** e.g. "daily", "weekly", "monthly" */
    @Column(nullable = false)
    private String period;

    /** Specific period key, e.g. "daily:2026-03-04", "weekly:2026-03-03", "monthly:2026-03" */
    @Column(name = "period_key", nullable = false)
    private String periodKey;

    /** Total focus seconds in this period */
    @Column(name = "total_seconds")
    private Long totalSeconds;

    /** Total focus minutes (totalSeconds / 60) for display */
    @Column(name = "total_minutes")
    private Long totalMinutes;

    /** Current rank (1 = best) */
    @Column(name = "current_rank")
    private Integer rank;

    /** Rank in previous period */
    @Column(name = "previous_rank")
    private Integer previousRank;

    /** Trend: "up", "down", "stable" */
    private String trend;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
