package com.kiemnv.MindGardAPI.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePaymentRequest {
    
    @NotNull(message = "Plan ID is required")
    private Long planId;
    
    @NotBlank(message = "Payment method is required")
    private String paymentMethod; // "VNPAY", "MOMO", etc.
}
