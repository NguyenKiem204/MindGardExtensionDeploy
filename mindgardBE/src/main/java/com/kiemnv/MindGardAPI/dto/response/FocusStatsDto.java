package com.kiemnv.MindGardAPI.dto.response;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.List;

/**
 * Match FE extension: Statistics – streak and aggregateByWeekday (totals by Sun-Sat).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FocusStatsDto {
    private Integer streak;
    private List<Integer> weekdayTotals; // [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
}
