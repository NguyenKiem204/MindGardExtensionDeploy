package com.kiemnv.MindGardAPI.controller;

import com.kiemnv.MindGardAPI.dto.response.ApiResponse;
import com.kiemnv.MindGardAPI.entity.Settings;
import com.kiemnv.MindGardAPI.entity.User;
import com.kiemnv.MindGardAPI.service.SettingsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
@Tag(name = "Settings", description = "User settings")
public class SettingsController {

    private final SettingsService settingsService;

    @GetMapping
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get my settings")
    public ResponseEntity<ApiResponse<Settings>> get(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        Settings s = settingsService.getForUser(user);
        return ResponseEntity.ok(ApiResponse.success(s, "Settings retrieved"));
    }

    @PutMapping
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update my settings")
    public ResponseEntity<ApiResponse<Settings>> update(@RequestBody Settings update, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        Settings s = settingsService.update(user, update);
        return ResponseEntity.ok(ApiResponse.success(s, "Settings updated"));
    }
}
