package com.kiemnv.MindGardAPI.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MusicResponse {
    private String id;
    private String name;
    private String thumbnail;
    private String src; // YouTube ID or URL
    private String type; // "YOUTUBE" or "MP3"
    private String category;
}
