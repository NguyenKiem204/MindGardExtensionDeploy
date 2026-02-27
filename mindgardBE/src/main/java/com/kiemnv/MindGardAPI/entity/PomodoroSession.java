package com.kiemnv.MindGardAPI.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "pomodoro_sessions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PomodoroSession {

    public enum Status { RUNNING, FINISHED, ABORTED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String task;

    private LocalDateTime startAt;

    private LocalDateTime endAt;

    private Long durationSeconds;

    private Integer interruptions;

    // --- Advanced Analytics ---
    @Column(name = "distraction_count")
    @Builder.Default
    private Integer distractionCount = 0;

    @Column(name = "project_id")
    private Long projectId;

    @Enumerated(EnumType.STRING)
    private Status status;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
