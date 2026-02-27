package com.kiemnv.MindGardAPI.controller;

import com.kiemnv.MindGardAPI.dto.response.ApiResponse;
import com.kiemnv.MindGardAPI.dto.response.LeaderboardEntryDto;
import com.kiemnv.MindGardAPI.entity.LeaderboardEntry;
import com.kiemnv.MindGardAPI.entity.User;
import com.kiemnv.MindGardAPI.service.LeaderboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    @GetMapping
    @Operation(summary = "List leaderboard for period")
    public ResponseEntity<ApiResponse<Page<LeaderboardEntry>>> list(@RequestParam(defaultValue = "weekly") String period, Pageable pageable) {
        Page<LeaderboardEntry> page = leaderboardService.list(period, pageable);
        return ResponseEntity.ok(ApiResponse.success(page, "Leaderboard retrieved"));
    }

    @GetMapping("/top")
    @Operation(summary = "Top leaderboard entries for period")
    public ResponseEntity<ApiResponse<List<LeaderboardEntry>>> top(@RequestParam(defaultValue = "weekly") String period) {
        List<LeaderboardEntry> list = leaderboardService.top(period);
        return ResponseEntity.ok(ApiResponse.success(list, "Top entries retrieved"));
    }

    @GetMapping("/real")
    @Operation(summary = "Get real leaderboard from actual data", description = "Get leaderboard calculated from PomodoroSession data for a period (daily/weekly/monthly) and scope (global/friends)")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<List<LeaderboardEntryDto>>> getRealLeaderboard(
            @RequestParam(defaultValue = "weekly") String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(defaultValue = "global") String scope,
            Authentication authentication) {
        log.info("[LeaderboardController] getRealLeaderboard called: period={}, date={}, scope={}, auth={}", 
                period, date, scope, authentication != null);
        
        if (date == null) date = LocalDate.now();
        Long userId = null;
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            userId = ((User) authentication.getPrincipal()).getId();
            log.info("[LeaderboardController] Authenticated user ID: {}", userId);
        } else {
            log.warn("[LeaderboardController] No authentication or invalid principal");
        }
        
        List<LeaderboardEntryDto> entries = leaderboardService.getRealLeaderboard(period, date, scope, userId);
        log.info("[LeaderboardController] Returning {} entries", entries.size());
        return ResponseEntity.ok(ApiResponse.success(entries, "Real leaderboard retrieved"));
    }
}
