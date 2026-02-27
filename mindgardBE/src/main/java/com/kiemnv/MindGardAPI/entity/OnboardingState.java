package com.kiemnv.MindGardAPI.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "onboarding_states")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OnboardingState {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(columnDefinition = "text")
    private String completedStepsJson;

    // --- FE extension onboarding ---
    private Boolean hasCompleted;
    private String userName;
    private Integer workMin;
    private Integer breakMin;
    private String background;   // "" | "auto"
    private Boolean autoBackground;
    private String defaultEffect; // rain | snow | sunny

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
