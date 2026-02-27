package com.kiemnv.MindGardAPI.service;

import com.kiemnv.MindGardAPI.dto.response.LeaderboardEntryDto;
import com.kiemnv.MindGardAPI.entity.LeaderboardEntry;
import com.kiemnv.MindGardAPI.entity.User;
import com.kiemnv.MindGardAPI.repository.LeaderboardRepository;
import com.kiemnv.MindGardAPI.repository.PomodoroRepository;
import com.kiemnv.MindGardAPI.repository.UserRepository;
import com.kiemnv.MindGardAPI.service.FriendService;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LeaderboardService {

    private final LeaderboardRepository leaderboardRepository;
    private final PomodoroRepository pomodoroRepository;
    private final UserRepository userRepository;
    private final FriendService friendService;

    public Page<LeaderboardEntry> list(String period, Pageable pageable) {
        return leaderboardRepository.findByPeriod(period, pageable);
    }

    public List<LeaderboardEntry> top(String period) {
        return leaderboardRepository.findByPeriodOrderByScoreDesc(period);
    }

    @Transactional
    public LeaderboardEntry upsert(User user, String period, Long score) {
        LeaderboardEntry e = LeaderboardEntry.builder().user(user).period(period).score(score).rank(null).createdAt(LocalDateTime.now()).build();
        return leaderboardRepository.save(e);
    }

    /**
     * Get leaderboard from real data (PomodoroSession) for a period
     * @param period "daily", "weekly", or "monthly"
     * @param date The reference date (for daily/weekly/monthly calculation)
     * @param scope "global" or "friends" (if friends, userId is required)
     * @param userId Current user ID (for friends scope)
     * @param includeTrend Whether to calculate trend (requires previous period lookup)
     * @return List of leaderboard entries sorted by total minutes
     */
    @Transactional(readOnly = true)
    public List<LeaderboardEntryDto> getRealLeaderboard(String period, LocalDate date, String scope, Long userId, boolean includeTrend) {
        log.info("[LeaderboardService] getRealLeaderboard called: period={}, date={}, scope={}, userId={}", 
                period, date, scope, userId);
        
        LocalDateTime startDate;
        LocalDateTime endDate;

        switch (period.toLowerCase()) {
            case "daily":
                startDate = LocalDateTime.of(date, LocalTime.MIN);
                endDate = LocalDateTime.of(date, LocalTime.MAX);
                break;
            case "weekly":
                // Monday of the week
                int dayOfWeek = date.getDayOfWeek().getValue() - 1; // Monday = 0
                startDate = LocalDateTime.of(date.minusDays(dayOfWeek), LocalTime.MIN);
                endDate = LocalDateTime.of(startDate.toLocalDate().plusDays(6), LocalTime.MAX);
                break;
            case "monthly":
                startDate = LocalDateTime.of(date.withDayOfMonth(1), LocalTime.MIN);
                endDate = LocalDateTime.of(startDate.toLocalDate().plusMonths(1).minusDays(1), LocalTime.MAX);
                break;
            default:
                startDate = LocalDateTime.of(date, LocalTime.MIN);
                endDate = LocalDateTime.of(date, LocalTime.MAX);
        }

        log.info("[LeaderboardService] Date range: startDate={}, endDate={}", startDate, endDate);

        List<User> users;
        if ("friends".equals(scope) && userId != null) {
            // Get friends list
            users = userRepository.findAll().stream()
                    .filter(u -> {
                        try {
                            String status = friendService.getRelationshipStatus(userId, u.getId());
                            return "ACCEPTED".equals(status);
                        } catch (Exception e) {
                            log.warn("[LeaderboardService] Error getting relationship status: userId={}, targetId={}", 
                                    userId, u.getId(), e);
                            return false;
                        }
                    })
                    .collect(Collectors.toList());
            userRepository.findById(userId).ifPresent(users::add);
            log.info("[LeaderboardService] Friends scope: found {} friends (including self)", users.size());
        } else {
            users = userRepository.findAll();
            log.info("[LeaderboardService] Global scope: found {} users", users.size());
        }

        LocalDateTime finalStartDate = startDate;
        LocalDateTime finalEndDate = endDate;
        log.info("[LeaderboardService] Querying pomodoro sessions: startDate={}, endDate={}, users={}", 
                finalStartDate, finalEndDate, users.size());
        
        List<LeaderboardEntryDto> entries = users.stream()
                .map(user -> {
                    Long totalSeconds = pomodoroRepository.sumDurationSecondsByUserIdAndDateRange(
                            user.getId(), finalStartDate, finalEndDate);
                    if (totalSeconds == null) totalSeconds = 0L;
                    long totalMinutes = totalSeconds / 60;
                    
                    log.debug("[LeaderboardService] User {}: {} seconds = {} minutes", 
                            user.getId(), totalSeconds, totalMinutes);

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
                            .totalMinutes(totalMinutes)
                            .rank(null) // Will be set after sorting
                            .build();
                })
                .filter(e -> e.getTotalMinutes() > 0) // Only include users with activity
                .sorted((a, b) -> Long.compare(b.getTotalMinutes(), a.getTotalMinutes()))
                .collect(Collectors.toList());

        log.info("[LeaderboardService] After filtering (totalMinutes > 0): {} entries", entries.size());

        for (int i = 0; i < entries.size(); i++) {
            entries.get(i).setRank(i + 1);
        }

        if (includeTrend) {
            LocalDate previousDate;
            switch (period.toLowerCase()) {
                case "daily":
                    previousDate = date.minusDays(1);
                    break;
                case "weekly":
                    previousDate = date.minusWeeks(1);
                    break;
                case "monthly":
                    previousDate = date.minusMonths(1);
                    break;
                default:
                    previousDate = date.minusDays(1);
            }

            // Get previous period leaderboard for comparison (without trend to avoid infinite recursion)
            List<LeaderboardEntryDto> previousEntries = getRealLeaderboard(period, previousDate, scope, userId, false);
            java.util.Map<Long, Integer> previousRankMap = previousEntries.stream()
                    .collect(java.util.stream.Collectors.toMap(
                            LeaderboardEntryDto::getUserId,
                            LeaderboardEntryDto::getRank,
                            (a, b) -> a
                    ));

            // Calculate trend for each entry
            for (LeaderboardEntryDto entry : entries) {
                Integer prevRank = previousRankMap.get(entry.getUserId());
                entry.setPreviousRank(prevRank);
                
                if (prevRank == null) {
                    // New entry - no previous rank
                    entry.setTrend("up");
                } else {
                    int currentRank = entry.getRank();
                    if (currentRank < prevRank) {
                        entry.setTrend("up"); // Rank improved (lower number = better)
                    } else if (currentRank > prevRank) {
                        entry.setTrend("down"); // Rank worsened
                    } else {
                        entry.setTrend("stable"); // Same rank
                    }
                }
            }
        }

        // Limit to top 100
        List<LeaderboardEntryDto> topEntries = entries.stream()
                .limit(100)
                .collect(Collectors.toList());

        log.info("[LeaderboardService] Returning {} entries (top 100)", topEntries.size());
        return topEntries;
    }

    // Overload for backward compatibility (default includeTrend = true)
    @Transactional(readOnly = true)
    public List<LeaderboardEntryDto> getRealLeaderboard(String period, LocalDate date, String scope, Long userId) {
        return getRealLeaderboard(period, date, scope, userId, true);
    }
}
