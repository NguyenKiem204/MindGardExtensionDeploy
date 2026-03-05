package com.kiemnv.MindGardAPI.dto.request;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuickLinkRequest {
    private String label;  // FE: label (map to entity.title)
    private String url;
    private String icon;   // FE: icon, e.g. "🔗"
    private Integer ordering;
}
