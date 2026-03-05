package com.kiemnv.MindGardAPI.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "settings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Settings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    private String timezone;

    private String theme;

    @Column(columnDefinition = "text")
    private String pomodoroDefaults; // JSON string with focus/short/long

    private Boolean notifications;

    private Boolean syncEnabled;

    // --- FE extension (Options, QuickNotes) ---
    private Integer workMin;       // Pomodoro work minutes, default 25
    private Integer breakMin;      // Pomodoro break minutes, default 5
    private String defaultEffect;  // rain | snow | sunny
    private String background;     // url or "auto" | ""
    @Column(columnDefinition = "text")
    private String quickNotes;     // FE: quickNotes single text
    @Column(columnDefinition = "text")
    private String allowedDomains;

    // --- Premium features ---
    @Column(name = "focus_mode_type")
    @Builder.Default
    private String focusModeType = "MANUAL"; // MANUAL, AI

    @Column(name = "ai_strictness_level")
    @Builder.Default
    private Integer aiStrictnessLevel = 1; // 1 (Lenient) to 3 (Strict)

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
