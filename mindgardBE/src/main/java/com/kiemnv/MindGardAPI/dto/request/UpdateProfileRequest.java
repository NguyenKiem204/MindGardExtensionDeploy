package com.kiemnv.MindGardAPI.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {
    @Size(max = 255)
    private String firstName;
    
    @Size(max = 255)
    private String lastName;
    
    @Size(max = 500)
    private String avatarUrl;
    
    @Size(max = 500)
    private String bio;
}
