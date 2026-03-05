package com.kiemnv.MindGardAPI.controller;

import com.kiemnv.MindGardAPI.dto.response.ApiResponse;
import com.kiemnv.MindGardAPI.entity.Scene;
import com.kiemnv.MindGardAPI.entity.User;
import com.kiemnv.MindGardAPI.service.SceneService;
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
@RequestMapping("/api/scenes")
@RequiredArgsConstructor
@Tag(name = "Scenes", description = "Visual/auditory scenes")
public class SceneController {

    private final SceneService sceneService;

    @GetMapping
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "List scenes (paged)")
    public ResponseEntity<ApiResponse<Page<Scene>>> list(Pageable pageable, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        Page<Scene> page = sceneService.list(user, pageable);
        return ResponseEntity.ok(ApiResponse.success(page, "Scenes retrieved"));
    }

    @GetMapping("/all")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "List all scenes (user + defaults)")
    public ResponseEntity<ApiResponse<List<Scene>>> listAll(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<Scene> list = sceneService.listAll(user);
        return ResponseEntity.ok(ApiResponse.success(list, "Scenes retrieved"));
    }

    @PostMapping
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Create scene")
    public ResponseEntity<ApiResponse<Scene>> create(@RequestBody Scene s, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        Scene created = sceneService.create(user, s);
        return ResponseEntity.ok(ApiResponse.success(created, "Scene created"));
    }

    @PutMapping("/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update scene")
    public ResponseEntity<ApiResponse<Scene>> update(@PathVariable Long id, @RequestBody Scene update, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        Scene s = sceneService.update(id, user, update);
        return ResponseEntity.ok(ApiResponse.success(s, "Scene updated"));
    }

    @DeleteMapping("/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Delete scene")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        sceneService.delete(id, user);
        return ResponseEntity.ok(ApiResponse.success(null, "Scene deleted"));
    }
}
