package com.kiemnv.MindGardAPI.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FriendUserDto {
    private Long id;
    private String username;
    private String displayName;
    private String avatarUrl;
    private Integer level;
}

