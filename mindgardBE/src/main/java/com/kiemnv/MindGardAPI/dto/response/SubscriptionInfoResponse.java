package com.kiemnv.MindGardAPI.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionInfoResponse {
    private Long subscriptionId;
    private String planName;
    private String planCode;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String status;
    private long daysRemaining;
}
