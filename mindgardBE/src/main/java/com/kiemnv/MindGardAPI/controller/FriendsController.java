package com.kiemnv.MindGardAPI.controller;

import com.kiemnv.MindGardAPI.dto.response.ApiResponse;
import com.kiemnv.MindGardAPI.dto.response.FriendRequestDto;
import com.kiemnv.MindGardAPI.dto.response.FriendUserDto;
import com.kiemnv.MindGardAPI.dto.request.FriendInviteRequest;
import com.kiemnv.MindGardAPI.entity.User;
import com.kiemnv.MindGardAPI.service.FriendService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
@Tag(name = "Friends", description = "Friend requests and friendships")
public class FriendsController {

    private final FriendService friendService;

    @GetMapping
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "List my friends")
    public ResponseEntity<ApiResponse<List<FriendUserDto>>> listFriends(Authentication authentication) {
        User me = (User) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(friendService.friends(me), "Friends retrieved"));
    }

    @GetMapping("/requests/incoming")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Incoming friend requests")
    public ResponseEntity<ApiResponse<List<FriendRequestDto>>> incoming(Authentication authentication) {
        User me = (User) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(friendService.incoming(me), "Incoming requests"));
    }

    @GetMapping("/requests/outgoing")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Outgoing friend requests")
    public ResponseEntity<ApiResponse<List<FriendRequestDto>>> outgoing(Authentication authentication) {
        User me = (User) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(friendService.outgoing(me), "Outgoing requests"));
    }

    @PostMapping("/requests/{recipientId}")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Send friend request to recipientId")
    public ResponseEntity<ApiResponse<FriendRequestDto>> send(@PathVariable Long recipientId, Authentication authentication) {
        User me = (User) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(friendService.sendRequest(me, recipientId), "Request sent"));
    }

    @PostMapping("/requests/invite")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Send friend request by username/email")
    public ResponseEntity<ApiResponse<FriendRequestDto>> invite(@Valid @RequestBody FriendInviteRequest req, Authentication authentication) {
        User me = (User) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(friendService.sendRequestByIdentifier(me, req.getIdentifier()), "Request sent"));
    }

    @PostMapping("/requests/{requestId}/accept")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Accept incoming friend request")
    public ResponseEntity<ApiResponse<FriendRequestDto>> accept(@PathVariable Long requestId, Authentication authentication) {
        User me = (User) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(friendService.accept(me, requestId), "Request accepted"));
    }

    @PostMapping("/requests/{requestId}/decline")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Decline incoming friend request")
    public ResponseEntity<ApiResponse<FriendRequestDto>> decline(@PathVariable Long requestId, Authentication authentication) {
        User me = (User) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(friendService.decline(me, requestId), "Request declined"));
    }

    @PostMapping("/requests/{requestId}/cancel")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Cancel outgoing friend request")
    public ResponseEntity<ApiResponse<FriendRequestDto>> cancel(@PathVariable Long requestId, Authentication authentication) {
        User me = (User) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(friendService.cancel(me, requestId), "Request canceled"));
    }

    @DeleteMapping("/{otherUserId}")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Unfriend other user")
    public ResponseEntity<ApiResponse<Void>> unfriend(@PathVariable Long otherUserId, Authentication authentication) {
        User me = (User) authentication.getPrincipal();
        friendService.unfriend(me, otherUserId);
        return ResponseEntity.ok(ApiResponse.success(null, "Unfriended"));
    }

    @GetMapping("/relationship/{targetId}")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get relationship status with target")
    public ResponseEntity<ApiResponse<Map<String, String>>> relationship(@PathVariable Long targetId, Authentication authentication) {
        User me = (User) authentication.getPrincipal();
        String status = friendService.getRelationshipStatus(me.getId(), targetId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("status", status), "Relationship status"));
    }
}

