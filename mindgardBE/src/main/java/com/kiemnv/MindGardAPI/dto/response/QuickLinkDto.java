package com.kiemnv.MindGardAPI.dto.response;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuickLinkDto {
    private Long id;
    private String label;  // FE: label (from entity.title)
    private String url;
    private String icon;   // FE: icon
    private Integer ordering;
}
