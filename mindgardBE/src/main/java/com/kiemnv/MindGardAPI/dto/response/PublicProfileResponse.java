package com.kiemnv.MindGardAPI.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicProfileResponse {
    // User basic info
    private Long id;
    private String username;
    private String displayName;
    private String avatarUrl;
    private String accountTag;
    private String bio;
    
    // Level & XP
    private Integer level;
    private Long currentXP;
    private Long xpToNextLevel;
    private Long remainingXPToNextLevel;
    
    // Statistics
    private Integer currentStreakDays;
    private Long totalStudyDurationMinutes;
    private Integer pomodorosCompletedCount;
    private Integer pomodorosThisWeekCount;
    private Long dailyAverageStudyDurationLast30DaysMinutes;
    private Integer giftsSentCount;
    
    // Friend status (if viewing other user's profile)
    private Boolean isFriend;
    private String friendRequestStatus; // NONE, SENT, RECEIVED, ACCEPTED
    private Long friendsCount;
    private Long friendRequestId; // pending request id if SENT/RECEIVED
    
    // Study activity heatmap data (key: "YYYY-MM-DD", value: durationMinutes)
    private Map<String, Integer> studyActivityData;
}
