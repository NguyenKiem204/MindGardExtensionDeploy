package com.kiemnv.MindGardAPI.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class FriendInviteRequest {
    @NotBlank
    private String identifier; // username or email
}

