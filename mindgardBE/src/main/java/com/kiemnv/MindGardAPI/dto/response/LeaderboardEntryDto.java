package com.kiemnv.MindGardAPI.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardEntryDto {
    private Long id;
    private Long userId;
    private String username;
    private String displayName;
    private String avatarUrl;
    private String bio;
    private Integer level;
    private Long totalMinutes; // Total focus time in minutes for the period
    private Integer rank;
    private String country; // Optional country code
    private String trend; // "up", "down", "stable" - compared to previous period
    private Integer previousRank; // Rank in previous period
}
