package com.kiemnv.MindGardAPI.dto.response;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

/**
 * Match FE extension: focusSessions array item for Statistics / pomodoroStats.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FocusSessionDto {
    private String dateISO;
    private Integer durationMin;
    private String taskTitle;
}
