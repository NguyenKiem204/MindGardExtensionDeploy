package com.kiemnv.MindGardAPI.controller;

import com.kiemnv.MindGardAPI.dto.response.ApiResponse;
import com.kiemnv.MindGardAPI.entity.OnboardingState;
import com.kiemnv.MindGardAPI.entity.User;
import com.kiemnv.MindGardAPI.service.OnboardingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/onboarding")
@RequiredArgsConstructor
@Tag(name = "Onboarding", description = "User onboarding state")
public class OnboardingController {

    private final OnboardingService onboardingService;

    @GetMapping
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get onboarding state for user")
    public ResponseEntity<ApiResponse<OnboardingState>> get(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        OnboardingState s = onboardingService.getForUser(user);
        return ResponseEntity.ok(ApiResponse.success(s, "Onboarding retrieved"));
    }

    @PostMapping
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update onboarding state for user")
    public ResponseEntity<ApiResponse<OnboardingState>> upsert(@RequestBody OnboardingState state, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        OnboardingState s = onboardingService.upsert(user, state);
        return ResponseEntity.ok(ApiResponse.success(s, "Onboarding saved"));
    }
}
