package com.kiemnv.MindGardAPI.controller;

import com.kiemnv.MindGardAPI.dto.response.ApiResponse;
import com.kiemnv.MindGardAPI.entity.Sound;
import com.kiemnv.MindGardAPI.entity.User;
import com.kiemnv.MindGardAPI.service.SoundService;
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
@RequestMapping("/api/sounds")
@RequiredArgsConstructor
@Tag(name = "Sounds", description = "Sound resources")
public class SoundController {

    private final SoundService soundService;

    @GetMapping("/music")
    @Operation(summary = "List curated music (Hardcoded)")
    public ResponseEntity<ApiResponse<List<com.kiemnv.MindGardAPI.dto.response.MusicResponse>>> listMusic() {
        return ResponseEntity.ok(ApiResponse.success(soundService.getMusicList(), "Music list retrieved"));
    }

    @GetMapping
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "List sounds (paged)")
    public ResponseEntity<ApiResponse<Page<Sound>>> list(Pageable pageable, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        Page<Sound> page = soundService.list(user, pageable);
        return ResponseEntity.ok(ApiResponse.success(page, "Sounds retrieved"));
    }

    @GetMapping("/all")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "List all sounds (user + builtins)")
    public ResponseEntity<ApiResponse<List<Sound>>> listAll(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<Sound> list = soundService.listAll(user);
        return ResponseEntity.ok(ApiResponse.success(list, "Sounds retrieved"));
    }

    @PostMapping
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Create sound")
    public ResponseEntity<ApiResponse<Sound>> create(@RequestBody Sound s, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        Sound created = soundService.create(user, s);
        return ResponseEntity.ok(ApiResponse.success(created, "Sound created"));
    }

    @PutMapping("/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update sound")
    public ResponseEntity<ApiResponse<Sound>> update(@PathVariable Long id, @RequestBody Sound update, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        Sound s = soundService.update(id, user, update);
        return ResponseEntity.ok(ApiResponse.success(s, "Sound updated"));
    }

    @DeleteMapping("/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Delete sound")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        soundService.delete(id, user);
        return ResponseEntity.ok(ApiResponse.success(null, "Sound deleted"));
    }
}
