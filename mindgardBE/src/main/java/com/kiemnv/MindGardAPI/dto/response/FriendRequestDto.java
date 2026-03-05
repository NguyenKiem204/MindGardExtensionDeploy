package com.kiemnv.MindGardAPI.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FriendRequestDto {
    private Long id;
    private String status; // PENDING/ACCEPTED/DECLINED/CANCELED
    private LocalDateTime createdAt;
    private LocalDateTime respondedAt;

    private FriendUserDto requester;
    private FriendUserDto recipient;
}

