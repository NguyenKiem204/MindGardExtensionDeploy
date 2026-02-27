package com.kiemnv.MindGardAPI.service;

import com.kiemnv.MindGardAPI.dto.response.PublicProfileResponse;
import com.kiemnv.MindGardAPI.entity.PomodoroSession;
import com.kiemnv.MindGardAPI.entity.User;
import com.kiemnv.MindGardAPI.entity.UserStats;
import com.kiemnv.MindGardAPI.service.FriendService;
import com.kiemnv.MindGardAPI.repository.PomodoroRepository;
import com.kiemnv.MindGardAPI.repository.UserRepository;
import com.kiemnv.MindGardAPI.repository.UserStatsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final UserStatsRepository userStatsRepository;
    private final PomodoroRepository pomodoroRepository;
    private final FriendService friendService;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }

    @Transactional(readOnly = true)
    public Page<User> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }

    @Transactional
    public User updateUser(Long id, User userUpdate) {
        User existingUser = getUserById(id);

        if (userUpdate.getFirstName() != null) {
            existingUser.setFirstName(userUpdate.getFirstName());
        }
        if (userUpdate.getLastName() != null) {
            existingUser.setLastName(userUpdate.getLastName());
        }
        if (userUpdate.getEmail() != null) {
            existingUser.setEmail(userUpdate.getEmail());
        }
        if (userUpdate.getAvatarUrl() != null) {
            existingUser.setAvatarUrl(userUpdate.getAvatarUrl());
        }
        if (userUpdate.getBio() != null) {
            existingUser.setBio(userUpdate.getBio());
        }
        existingUser.setUpdatedAt(LocalDateTime.now());

        return userRepository.save(existingUser);
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = getUserById(id);
        userRepository.delete(user);
    }

    @Transactional(readOnly = true)
    public PublicProfileResponse getPublicProfile(Long userId, Integer year, Long viewerId) {
        User user = getUserById(userId);
        UserStats stats = userStatsRepository.findByUserId(userId).orElse(null);
        
        // Calculate display name
        String displayName = (user.getFirstName() != null && user.getLastName() != null) 
            ? (user.getFirstName() + " " + user.getLastName()).trim()
            : (user.getFirstName() != null ? user.getFirstName() : user.getUsername());
        
        // Get basic stats
        Long totalFocusSeconds = stats != null && stats.getTotalFocusSeconds() != null 
            ? stats.getTotalFocusSeconds() : 0L;
        Integer pomodoroCount = stats != null && stats.getPomodoroCount() != null 
            ? stats.getPomodoroCount() : 0;
        Integer currentStreakDays = stats != null && stats.getDailyStreak() != null 
            ? stats.getDailyStreak() : 0;
        
        // Calculate from PomodoroSession if stats are missing
        Long totalPomodoros = pomodoroRepository.countFinishedByUserId(userId);
        if (totalPomodoros > 0 && pomodoroCount == 0) {
            pomodoroCount = totalPomodoros.intValue();
        }
        if (totalFocusSeconds == 0) {
            Long sumDuration = pomodoroRepository.sumDurationSecondsByUserId(userId);
            if (sumDuration != null) {
                totalFocusSeconds = sumDuration;
            }
        }
        
        // This week pomodoros (Monday 00:00 UTC-local)
        LocalDateTime startOfWeek = LocalDate.now()
                .with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY))
                .atStartOfDay();
        Long pomodorosThisWeek = pomodoroRepository.countFinishedThisWeekByUserId(userId, startOfWeek);
        
        // Daily average last 30 days
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        Long totalSecondsLast30Days = pomodoroRepository.sumDurationSecondsByUserIdAndDateRange(
            userId, thirtyDaysAgo, LocalDateTime.now());
        Long dailyAverageMinutes = totalSecondsLast30Days != null && totalSecondsLast30Days > 0
            ? (totalSecondsLast30Days / 30) / 60 : 0L;
        
        // Calculate remaining XP
        Long remainingXP = user.getXpToNextLevel() != null && user.getCurrentXP() != null
            ? Math.max(0, user.getXpToNextLevel() - user.getCurrentXP()) : 0L;
        
        // Study activity heatmap for the year
        LocalDateTime yearStart = Year.of(year != null ? year : Year.now().getValue()).atDay(1).atStartOfDay();
        LocalDateTime yearEnd = yearStart.plusYears(1);
        List<PomodoroSession> sessions = pomodoroRepository.findByUserIdAndDateRange(userId, yearStart, yearEnd);
        
        Map<String, Integer> studyActivityData = new HashMap<>();
        for (PomodoroSession session : sessions) {
            if (session.getEndAt() != null && session.getDurationSeconds() != null) {
                String dateKey = session.getEndAt().toLocalDate().toString();
                int durationMinutes = (int) (session.getDurationSeconds() / 60);
                studyActivityData.merge(dateKey, durationMinutes, Integer::sum);
            }
        }
        
        String friendStatus = viewerId != null ? friendService.getRelationshipStatus(viewerId, userId) : "NONE";
        boolean isFriend = "ACCEPTED".equals(friendStatus);
        long friendsCount = friendService.countFriends(userId);
        Long friendRequestId = viewerId != null ? friendService.getPendingRequestIdBetween(viewerId, userId) : null;

        return PublicProfileResponse.builder()
            .id(user.getId())
            .username(user.getUsername())
            .displayName(displayName)
            .avatarUrl(user.getAvatarUrl())
            .accountTag(user.getAccountTag())
            .bio(user.getBio())
            .level(user.getLevel() != null ? user.getLevel() : 1)
            .currentXP(user.getCurrentXP() != null ? user.getCurrentXP() : 0L)
            .xpToNextLevel(user.getXpToNextLevel() != null ? user.getXpToNextLevel() : 100L)
            .remainingXPToNextLevel(remainingXP)
            .currentStreakDays(currentStreakDays)
            .totalStudyDurationMinutes(totalFocusSeconds / 60)
            .pomodorosCompletedCount(pomodoroCount)
            .pomodorosThisWeekCount(pomodorosThisWeek != null ? pomodorosThisWeek.intValue() : 0)
            .dailyAverageStudyDurationLast30DaysMinutes(dailyAverageMinutes)
            .giftsSentCount(0) // TODO: Implement gifts feature
            .isFriend(isFriend)
            .friendRequestStatus(friendStatus)
            .friendsCount(friendsCount)
            .friendRequestId(friendRequestId)
            .studyActivityData(studyActivityData)
            .build();
    }
}
