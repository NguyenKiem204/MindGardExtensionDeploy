package com.kiemnv.MindGardAPI.scheduler;

import com.kiemnv.MindGardAPI.entity.LeaderboardEntry;
import com.kiemnv.MindGardAPI.entity.User;
import com.kiemnv.MindGardAPI.repository.LeaderboardRepository;
import com.kiemnv.MindGardAPI.repository.PomodoroRepository;
import com.kiemnv.MindGardAPI.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class LeaderboardScheduler {

    private final LeaderboardRepository leaderboardRepository;
    private final PomodoroRepository pomodoroRepository;
    private final UserRepository userRepository;

    /**
     * Compute and cache leaderboard every 5 minutes for daily, weekly, monthly.
     */
    @Scheduled(fixedRate = 300_000) // 5 minutes
    @Transactional
    public void computeAllLeaderboards() {
        log.info("[LeaderboardScheduler] Starting leaderboard computation...");
        long start = System.currentTimeMillis();

        LocalDate today = LocalDate.now();
        Map<Long, User> userMap = userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getId, u -> u, (a, b) -> a));

        computeAndCacheLeaderboard("daily", today, userMap);
        computeAndCacheLeaderboard("weekly", today, userMap);
        computeAndCacheLeaderboard("monthly", today, userMap);

        long elapsed = System.currentTimeMillis() - start;
        log.info("[LeaderboardScheduler] Completed in {}ms", elapsed);
    }

    private void computeAndCacheLeaderboard(String period, LocalDate date, Map<Long, User> userMap) {
        String currentKey = buildPeriodKey(period, date);
        String previousKey = buildPreviousPeriodKey(period, date);

        // 1. Calculate date range for this period
        LocalDateTime[] range = getDateRange(period, date);
        LocalDateTime startDate = range[0];
        LocalDateTime endDate = range[1];

        log.info("[LeaderboardScheduler] Computing {}: key={}, range=[{}, {}]", period, currentKey, startDate, endDate);

        // 2. Batch query: get total seconds for all users in 1 query
        List<Object[]> results = pomodoroRepository.sumDurationGroupedByUser(startDate, endDate);

        // 3. Build entries, sort by total seconds desc
        List<UserScore> scores = new ArrayList<>();
        for (Object[] row : results) {
            Long userId = (Long) row[0];
            Long totalSeconds = (Long) row[1];
            if (totalSeconds == null || totalSeconds < 60) continue;
            scores.add(new UserScore(userId, totalSeconds));
        }
        scores.sort((a, b) -> Long.compare(b.totalSeconds, a.totalSeconds));

        // 4. Get previous period ranks for trend calculation
        Map<Long, Integer> previousRankMap = new HashMap<>();
        List<LeaderboardEntry> previousEntries = leaderboardRepository.findByPeriodKeyOrderByRankAsc(previousKey);
        for (LeaderboardEntry prev : previousEntries) {
            previousRankMap.put(prev.getUser().getId(), prev.getRank());
        }

        // 5. Delete old entries for current period, then insert new ones
        leaderboardRepository.deleteByPeriodKey(currentKey);
        leaderboardRepository.flush();

        List<LeaderboardEntry> newEntries = new ArrayList<>();
        for (int i = 0; i < scores.size() && i < 100; i++) {
            UserScore us = scores.get(i);
            int currentRank = i + 1;
            Integer prevRank = previousRankMap.get(us.userId);

            String trend;
            if (prevRank == null) {
                trend = "up"; // New entry
            } else if (currentRank < prevRank) {
                trend = "up";
            } else if (currentRank > prevRank) {
                trend = "down";
            } else {
                trend = "stable";
            }

            User user = userMap.get(us.userId);
            if (user == null) continue;

            LeaderboardEntry entry = LeaderboardEntry.builder()
                    .user(user)
                    .period(period)
                    .periodKey(currentKey)
                    .totalSeconds(us.totalSeconds)
                    .totalMinutes(us.totalSeconds / 60)
                    .rank(currentRank)
                    .previousRank(prevRank)
                    .trend(trend)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            newEntries.add(entry);
        }

        leaderboardRepository.saveAll(newEntries);
        log.info("[LeaderboardScheduler] Cached {} entries for {}", newEntries.size(), currentKey);
    }

    // --- Helper methods ---

    public static String buildPeriodKey(String period, LocalDate date) {
        switch (period.toLowerCase()) {
            case "daily":
                return "daily:" + date.toString();
            case "weekly":
                int dayOfWeek = date.getDayOfWeek().getValue() - 1; // Monday = 0
                LocalDate monday = date.minusDays(dayOfWeek);
                return "weekly:" + monday.toString();
            case "monthly":
                return "monthly:" + date.getYear() + "-" + String.format("%02d", date.getMonthValue());
            default:
                return "daily:" + date.toString();
        }
    }

    private String buildPreviousPeriodKey(String period, LocalDate date) {
        switch (period.toLowerCase()) {
            case "daily":
                return buildPeriodKey("daily", date.minusDays(1));
            case "weekly":
                return buildPeriodKey("weekly", date.minusWeeks(1));
            case "monthly":
                return buildPeriodKey("monthly", date.minusMonths(1));
            default:
                return buildPeriodKey("daily", date.minusDays(1));
        }
    }

    private LocalDateTime[] getDateRange(String period, LocalDate date) {
        LocalDateTime startDate;
        LocalDateTime endDate;

        switch (period.toLowerCase()) {
            case "daily":
                startDate = LocalDateTime.of(date, LocalTime.MIN);
                endDate = LocalDateTime.of(date, LocalTime.MAX);
                break;
            case "weekly":
                int dayOfWeek = date.getDayOfWeek().getValue() - 1;
                LocalDate monday = date.minusDays(dayOfWeek);
                startDate = LocalDateTime.of(monday, LocalTime.MIN);
                endDate = LocalDateTime.of(monday.plusDays(6), LocalTime.MAX);
                break;
            case "monthly":
                startDate = LocalDateTime.of(date.withDayOfMonth(1), LocalTime.MIN);
                endDate = LocalDateTime.of(date.withDayOfMonth(1).plusMonths(1).minusDays(1), LocalTime.MAX);
                break;
            default:
                startDate = LocalDateTime.of(date, LocalTime.MIN);
                endDate = LocalDateTime.of(date, LocalTime.MAX);
        }
        return new LocalDateTime[]{startDate, endDate};
    }

    private static class UserScore {
        final Long userId;
        final Long totalSeconds;

        UserScore(Long userId, Long totalSeconds) {
            this.userId = userId;
            this.totalSeconds = totalSeconds;
        }
    }
}
