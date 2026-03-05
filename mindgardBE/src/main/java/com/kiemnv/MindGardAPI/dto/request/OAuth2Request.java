package com.kiemnv.MindGardAPI.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OAuth2Request {
    @NotBlank(message = "Token is required")
    private String token;
}
