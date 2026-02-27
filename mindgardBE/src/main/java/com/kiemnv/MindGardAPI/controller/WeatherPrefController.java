package com.kiemnv.MindGardAPI.controller;

import com.kiemnv.MindGardAPI.dto.response.ApiResponse;
import com.kiemnv.MindGardAPI.entity.User;
import com.kiemnv.MindGardAPI.entity.WeatherPref;
import com.kiemnv.MindGardAPI.service.WeatherPrefService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/weather")
@RequiredArgsConstructor
@Tag(name = "Weather", description = "Weather preferences and proxy")
public class WeatherPrefController {

    private final WeatherPrefService weatherPrefService;

    @GetMapping
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get my weather preference")
    public ResponseEntity<ApiResponse<WeatherPref>> get(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        WeatherPref p = weatherPrefService.getForUser(user);
        return ResponseEntity.ok(ApiResponse.success(p, "Weather preference retrieved"));
    }

    @PostMapping
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Upsert my weather preference")
    public ResponseEntity<ApiResponse<WeatherPref>> upsert(@RequestBody WeatherPref pref, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        WeatherPref p = weatherPrefService.upsert(user, pref);
        return ResponseEntity.ok(ApiResponse.success(p, "Weather preference saved"));
    }
}
