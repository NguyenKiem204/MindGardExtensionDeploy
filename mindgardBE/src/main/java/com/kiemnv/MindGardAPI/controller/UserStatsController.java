package com.kiemnv.MindGardAPI.controller;

import com.kiemnv.MindGardAPI.dto.response.ApiResponse;
import com.kiemnv.MindGardAPI.dto.response.FocusStatsDto;
import com.kiemnv.MindGardAPI.entity.UserStats;
import com.kiemnv.MindGardAPI.entity.User;
import com.kiemnv.MindGardAPI.service.PomodoroService;
import com.kiemnv.MindGardAPI.service.UserStatsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
@Tag(name = "Stats", description = "User statistics – FE: /focus for streak & weekdayTotals")
public class UserStatsController {

    private final UserStatsService userStatsService;
    private final PomodoroService pomodoroService;

    @GetMapping
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get my stats")
    public ResponseEntity<ApiResponse<UserStats>> get(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        UserStats s = userStatsService.getForUser(user);
        return ResponseEntity.ok(ApiResponse.success(s, "Stats retrieved"));
    }

    /** FE extension: Statistics – streak and weekdayTotals (Sun–Sat) from focus sessions */
    @GetMapping("/focus")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get focus stats (FE: computeStreak, aggregateByWeekday)")
    public ResponseEntity<ApiResponse<FocusStatsDto>> focus(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        FocusStatsDto dto = pomodoroService.getFocusStats(user);
        return ResponseEntity.ok(ApiResponse.success(dto, "Focus stats retrieved"));
    }

    @PostMapping("/update")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update user stats (incremental)")
    public ResponseEntity<ApiResponse<UserStats>> update(@RequestParam(required = false) Long addFocusSeconds, @RequestParam(required = false) Integer addPomodoros, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        UserStats s = userStatsService.updateStats(user, addFocusSeconds, addPomodoros);
        return ResponseEntity.ok(ApiResponse.success(s, "Stats updated"));
    }
}
