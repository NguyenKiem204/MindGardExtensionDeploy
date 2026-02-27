package com.kiemnv.MindGardAPI.controller;

import com.kiemnv.MindGardAPI.dto.request.PomodoroRecordRequest;
import com.kiemnv.MindGardAPI.dto.response.ApiResponse;
import com.kiemnv.MindGardAPI.dto.response.FocusSessionDto;
import com.kiemnv.MindGardAPI.entity.PomodoroSession;
import com.kiemnv.MindGardAPI.entity.User;
import com.kiemnv.MindGardAPI.service.PomodoroService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pomodoros")
@RequiredArgsConstructor
@Tag(name = "Pomodoro", description = "Pomodoro timer sessions – FE: record, focus-sessions")
public class PomodoroController {

    private final PomodoroService pomodoroService;

    @GetMapping
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "List sessions (paged)")
    public ResponseEntity<ApiResponse<Page<PomodoroSession>>> list(Pageable pageable, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        Page<PomodoroSession> page = pomodoroService.list(user, pageable);
        return ResponseEntity.ok(ApiResponse.success(page, "Sessions retrieved"));
    }

    /** FE extension: record completed focus (like pomodoroStats.recordSession) */
    @PostMapping("/record")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Record completed focus session (FE: dateISO, durationMin, taskTitle)")
    public ResponseEntity<ApiResponse<PomodoroSession>> record(@RequestBody PomodoroRecordRequest req, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        PomodoroSession s = pomodoroService.record(user, req);
        return ResponseEntity.ok(ApiResponse.success(s, "Focus session recorded"));
    }

    /** FE extension: list for Statistics / readSessions – [{ dateISO, durationMin, taskTitle }] */
    @GetMapping("/focus-sessions")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "List focus sessions (FE: focusSessions for stats)")
    public ResponseEntity<ApiResponse<List<FocusSessionDto>>> focusSessions(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<FocusSessionDto> list = pomodoroService.listFocusSessions(user);
        return ResponseEntity.ok(ApiResponse.success(list, "Focus sessions retrieved"));
    }

    @PostMapping("/start")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Start pomodoro")
    public ResponseEntity<ApiResponse<PomodoroSession>> start(@RequestBody PomodoroSession req, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        PomodoroSession s = pomodoroService.start(user, req);
        return ResponseEntity.ok(ApiResponse.success(s, "Pomodoro started"));
    }

    @PostMapping("/{id}/stop")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Stop pomodoro")
    public ResponseEntity<ApiResponse<PomodoroSession>> stop(@PathVariable Long id, @RequestParam(defaultValue = "false") boolean interrupted, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        PomodoroSession s = pomodoroService.stop(id, user, interrupted);
        return ResponseEntity.ok(ApiResponse.success(s, "Pomodoro stopped"));
    }
}
