package com.kiemnv.MindGardAPI.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardResponseDto {
    private List<LeaderboardEntryDto> entries;
    private LeaderboardEntryDto currentUser; // Pinned current user entry (null if not ranked)
}
