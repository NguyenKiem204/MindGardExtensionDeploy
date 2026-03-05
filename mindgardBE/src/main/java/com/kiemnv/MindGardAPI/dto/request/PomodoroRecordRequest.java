package com.kiemnv.MindGardAPI.dto.request;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * Match FE extension: focusSessions item and recordSession payload.
 * dateISO: completion time (ISO string), durationMin: focus duration, taskTitle: task name.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PomodoroRecordRequest {
    private String dateISO;   // e.g. "2025-01-15T10:30:00.000Z"
    private Integer durationMin;
    private String taskTitle;
    private Boolean isPartial; // If true, record as ABORTED (partial session), otherwise FINISHED
}
