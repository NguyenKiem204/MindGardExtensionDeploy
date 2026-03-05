package com.kiemnv.MindGardAPI.controller;

import com.kiemnv.MindGardAPI.dto.response.ApiResponse;
import com.kiemnv.MindGardAPI.dto.response.LeaderboardEntryDto;
import com.kiemnv.MindGardAPI.dto.response.LeaderboardResponseDto;
import com.kiemnv.MindGardAPI.entity.User;
import com.kiemnv.MindGardAPI.service.LeaderboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/leaderboard")
@RequiredArgsConstructor
@Tag(name = "Leaderboard", description = "Leaderboard endpoints")
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    @GetMapping("/real")
    @Operation(summary = "Get leaderboard (cached)", description = "Returns leaderboard entries + current user's entry pinned separately.")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<LeaderboardResponseDto>> getRealLeaderboard(
            @RequestParam(defaultValue = "weekly") String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(defaultValue = "global") String scope,
            Authentication authentication) {
        log.info("[LeaderboardController] getRealLeaderboard: period={}, date={}, scope={}", period, date, scope);

        if (date == null) date = LocalDate.now();
        Long userId = null;
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            userId = ((User) authentication.getPrincipal()).getId();
        }

        List<LeaderboardEntryDto> entries = leaderboardService.getCachedLeaderboard(period, date, scope, userId);
        LeaderboardEntryDto currentUser = userId != null
                ? leaderboardService.getCurrentUserEntry(period, date, userId)
                : null;

        LeaderboardResponseDto response = LeaderboardResponseDto.builder()
                .entries(entries)
                .currentUser(currentUser)
                .build();

        return ResponseEntity.ok(ApiResponse.success(response, "Leaderboard retrieved"));
    }
}
