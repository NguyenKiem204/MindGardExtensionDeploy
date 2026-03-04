package com.kiemnv.MindGardAPI.service;

import com.kiemnv.MindGardAPI.dto.response.LeaderboardEntryDto;
import com.kiemnv.MindGardAPI.entity.LeaderboardEntry;
import com.kiemnv.MindGardAPI.entity.User;
import com.kiemnv.MindGardAPI.repository.LeaderboardRepository;
import com.kiemnv.MindGardAPI.repository.PomodoroRepository;
import com.kiemnv.MindGardAPI.repository.UserRepository;
import com.kiemnv.MindGardAPI.scheduler.LeaderboardScheduler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LeaderboardService {

    private final LeaderboardRepository leaderboardRepository;
    private final PomodoroRepository pomodoroRepository;
    private final FriendService friendService;
    private final UserRepository userRepository;

    /**
     * Get cached leaderboard from leaderboard_entries table.
     * Data is precomputed by LeaderboardScheduler every 5 minutes.
     */
    @Transactional(readOnly = true)
    public List<LeaderboardEntryDto> getCachedLeaderboard(String period, LocalDate date, String scope, Long userId) {
        String periodKey = LeaderboardScheduler.buildPeriodKey(period, date);
        log.info("[LeaderboardService] getCachedLeaderboard: periodKey={}, scope={}, userId={}", periodKey, scope, userId);

        List<LeaderboardEntry> entries;

        if ("friends".equals(scope) && userId != null) {
            List<Long> friendIds = getFriendUserIds(userId);
            friendIds.add(userId);
            entries = leaderboardRepository.findByPeriodKeyAndUserIdIn(periodKey, friendIds);

            // Re-rank within friends scope
            for (int i = 0; i < entries.size(); i++) {
                entries.get(i).setRank(i + 1);
            }
            log.info("[LeaderboardService] Friends scope: {} entries for {} friends", entries.size(), friendIds.size());
        } else {
            entries = leaderboardRepository.findByPeriodKeyOrderByRankAsc(periodKey);
            log.info("[LeaderboardService] Global scope: {} entries", entries.size());
        }

        List<LeaderboardEntryDto> dtos = entries.stream()
                .map(this::toDto)
                .collect(Collectors.toList());

        log.info("[LeaderboardService] Returning {} entries for periodKey={}", dtos.size(), periodKey);
        return dtos;
    }

    /**
     * Get current user's entry from cached leaderboard (for pinning at bottom).
     * Always returns an entry (even with 0 minutes) so the pinned row always shows.
     */
    @Transactional(readOnly = true)
    public LeaderboardEntryDto getCurrentUserEntry(String period, LocalDate date, Long userId) {
        String periodKey = LeaderboardScheduler.buildPeriodKey(period, date);
        return leaderboardRepository.findByPeriodKeyAndUserId(periodKey, userId)
                .map(this::toDto)
                .orElseGet(() -> {
                    // User has no entry yet — return a default with 0 minutes
                    User user = userRepository.findById(userId).orElse(null);
                    if (user == null) return null;
                    String displayName = user.getFirstName() != null && user.getLastName() != null
                            ? (user.getFirstName() + " " + user.getLastName()).trim()
                            : (user.getFirstName() != null ? user.getFirstName()
                            : (user.getLastName() != null ? user.getLastName()
                            : user.getUsername()));
                    return LeaderboardEntryDto.builder()
                            .id(user.getId())
                            .userId(user.getId())
                            .username(user.getUsername())
                            .displayName(displayName)
                            .avatarUrl(user.getAvatarUrl())
                            .bio(user.getBio())
                            .level(user.getLevel() != null ? user.getLevel() : 1)
                            .totalMinutes(0L)
                            .rank(null)
                            .trend(null)
                            .previousRank(null)
                            .build();
                });
    }

    /**
     * Write-through cache: immediately update a user's leaderboard entry
     * after they complete a Pomodoro session.
     * Updates daily, weekly, and monthly for the current date.
     */
    @Transactional
    public void updateUserLeaderboard(User user) {
        LocalDate today = LocalDate.now();
        log.info("[LeaderboardService] Write-through update for user {} ({})", user.getId(), user.getUsername());

        updateUserForPeriod(user, "daily", today);
        updateUserForPeriod(user, "weekly", today);
        updateUserForPeriod(user, "monthly", today);
    }

    private void updateUserForPeriod(User user, String period, LocalDate date) {
        String periodKey = LeaderboardScheduler.buildPeriodKey(period, date);
        LocalDateTime[] range = getDateRange(period, date);

        // Get this user's total seconds for the period
        Long totalSeconds = pomodoroRepository.sumDurationSecondsByUserIdAndDateRange(
                user.getId(), range[0], range[1]);
        if (totalSeconds == null) totalSeconds = 0L;

        if (totalSeconds < 60) {
            // User has no qualifying time, remove their entry if exists
            Optional<LeaderboardEntry> existing = leaderboardRepository.findByPeriodKeyAndUserId(periodKey, user.getId());
            existing.ifPresent(e -> leaderboardRepository.delete(e));
            reRankPeriod(periodKey);
            return;
        }

        long totalMinutes = totalSeconds / 60;

        // Upsert: find existing or create new
        LeaderboardEntry entry = leaderboardRepository.findByPeriodKeyAndUserId(periodKey, user.getId())
                .orElse(LeaderboardEntry.builder()
                        .user(user)
                        .period(period)
                        .periodKey(periodKey)
                        .createdAt(LocalDateTime.now())
                        .build());

        entry.setTotalSeconds(totalSeconds);
        entry.setTotalMinutes(totalMinutes);
        entry.setUpdatedAt(LocalDateTime.now());
        leaderboardRepository.save(entry);

        // Re-rank all entries for this period
        reRankPeriod(periodKey);

        log.info("[LeaderboardService] Write-through: user={}, period={}, totalMin={}",
                user.getId(), periodKey, totalMinutes);
    }

    /**
     * Re-rank all entries for a period key by totalSeconds descending.
     */
    private void reRankPeriod(String periodKey) {
        List<LeaderboardEntry> all = leaderboardRepository.findByPeriodKeyOrderByRankAsc(periodKey);
        // Sort by totalSeconds desc (the query sorts by rank, we need to re-sort by score)
        all.sort((a, b) -> Long.compare(
                b.getTotalSeconds() != null ? b.getTotalSeconds() : 0,
                a.getTotalSeconds() != null ? a.getTotalSeconds() : 0));

        for (int i = 0; i < all.size(); i++) {
            all.get(i).setRank(i + 1);
        }
        leaderboardRepository.saveAll(all);
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

    private LeaderboardEntryDto toDto(LeaderboardEntry entry) {
        User user = entry.getUser();
        String displayName = user.getFirstName() != null && user.getLastName() != null
                ? (user.getFirstName() + " " + user.getLastName()).trim()
                : (user.getFirstName() != null ? user.getFirstName()
                : (user.getLastName() != null ? user.getLastName()
                : user.getUsername()));

        return LeaderboardEntryDto.builder()
                .id(user.getId())
                .userId(user.getId())
                .username(user.getUsername())
                .displayName(displayName)
                .avatarUrl(user.getAvatarUrl())
                .bio(user.getBio())
                .level(user.getLevel() != null ? user.getLevel() : 1)
                .totalMinutes(entry.getTotalMinutes() != null ? entry.getTotalMinutes() : 0)
                .rank(entry.getRank())
                .trend(entry.getTrend())
                .previousRank(entry.getPreviousRank())
                .build();
    }

    private List<Long> getFriendUserIds(Long userId) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) return new java.util.ArrayList<>();
            return friendService.friends(user).stream()
                    .map(dto -> dto.getId())
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.warn("[LeaderboardService] Error getting friends: {}", e.getMessage());
            return new java.util.ArrayList<>();
        }
    }

    // --- Legacy methods (kept for backward compat) ---

    public Page<LeaderboardEntry> list(String period, Pageable pageable) {
        return leaderboardRepository.findByPeriod(period, pageable);
    }
}

