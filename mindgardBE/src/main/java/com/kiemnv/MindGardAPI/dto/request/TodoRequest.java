package com.kiemnv.MindGardAPI.dto.request;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TodoRequest {
    private String text;  // FE: text
    private Boolean done; // FE: done
}
