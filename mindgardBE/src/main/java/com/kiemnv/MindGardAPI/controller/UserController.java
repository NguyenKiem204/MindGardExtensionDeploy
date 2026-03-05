package com.kiemnv.MindGardAPI.controller;

import com.kiemnv.MindGardAPI.dto.request.UpdateProfileRequest;
import com.kiemnv.MindGardAPI.dto.response.ApiResponse;
import com.kiemnv.MindGardAPI.entity.User;
import com.kiemnv.MindGardAPI.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User management and profile")
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "List users (admin)", description = "Admin-only paginated list of users.")
    public ResponseEntity<ApiResponse<Page<User>>> getAllUsers(Pageable pageable) {
        Page<User> users = userService.getAllUsers(pageable);
        return ResponseEntity.ok(ApiResponse.success(users, "Users retrieved successfully"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.id")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get user by id", description = "Admin or the user themselves can fetch their user record.")
    public ResponseEntity<ApiResponse<User>> getUserById(@PathVariable Long id) {
        User user = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success(user, "User retrieved successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.id")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update user", description = "Admin or the user themselves can update their profile fields.")
    public ResponseEntity<ApiResponse<User>> updateUser(@PathVariable Long id, @RequestBody User userUpdate) {
        User user = userService.updateUser(id, userUpdate);
        return ResponseEntity.ok(ApiResponse.success(user, "User updated successfully"));
    }

    @PutMapping("/profile")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update my profile", description = "Update current user's profile (avatar, name, bio).")
    public ResponseEntity<ApiResponse<User>> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        User userUpdate = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .avatarUrl(request.getAvatarUrl())
                .bio(request.getBio())
                .build();
        User updated = userService.updateUser(currentUser.getId(), userUpdate);
        return ResponseEntity.ok(ApiResponse.success(updated, "Profile updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Delete user (admin)", description = "Admin-only delete.")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success(null, "User deleted successfully"));
    }

    @GetMapping("/profile")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get my profile", description = "Return the current user profile from access token context.")
    public ResponseEntity<ApiResponse<User>> getProfile(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(user, "Profile retrieved successfully"));
    }

    @GetMapping("/{id}/public-profile")
    @Operation(summary = "Get public profile", description = "Get public profile information for a user including stats and study activity.")
    public ResponseEntity<ApiResponse<com.kiemnv.MindGardAPI.dto.response.PublicProfileResponse>> getPublicProfile(
            @PathVariable Long id,
            @RequestParam(required = false) Integer year,
            Authentication authentication) {
        Long viewerId = null;
        try {
            if (authentication != null) {
                Object principal = authentication.getPrincipal();
                if (principal instanceof User) {
                    viewerId = ((User) principal).getId();
                }
            }
        } catch (Exception ignored) {}
        com.kiemnv.MindGardAPI.dto.response.PublicProfileResponse profile = userService.getPublicProfile(id, year, viewerId);
        return ResponseEntity.ok(ApiResponse.success(profile, "Public profile retrieved successfully"));
    }
}
