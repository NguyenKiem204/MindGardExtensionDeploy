package com.kiemnv.MindGardAPI.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "focus_rooms")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FocusRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "text")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "host_user_id", nullable = false)
    private User hostUser;

    @Column(name = "max_participants")
    @Builder.Default
    private Integer maxParticipants = 10;

    @Column(name = "is_premium_only")
    @Builder.Default
    private Boolean isPremiumOnly = true;

    @Column(name = "room_status")
    @Builder.Default
    private String roomStatus = "OPEN"; // OPEN, CLOSED, IN_SESSION

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "closed_at")
    private LocalDateTime closedAt;
}
