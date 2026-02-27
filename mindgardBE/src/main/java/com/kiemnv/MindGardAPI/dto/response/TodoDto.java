package com.kiemnv.MindGardAPI.dto.response;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TodoDto {
    private Long id;
    private String text;  // FE: text (map from entity.title)
    private Boolean done; // FE: done (map from entity.completed)
}
