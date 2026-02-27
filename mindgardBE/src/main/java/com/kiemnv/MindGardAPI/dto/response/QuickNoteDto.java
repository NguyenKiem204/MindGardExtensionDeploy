package com.kiemnv.MindGardAPI.dto.response;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

/**
 * Match FE extension: quickNotes – single text content.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuickNoteDto {
    private String content;
}
