package com.kiemnv.MindGardAPI.repository;

import com.kiemnv.MindGardAPI.entity.PomodoroSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PomodoroRepository extends JpaRepository<PomodoroSession, Long> {
    Page<PomodoroSession> findByUserId(Long userId, Pageable pageable);
    List<PomodoroSession> findTop1000ByUserIdAndStatusOrderByStartAtDesc(Long userId, PomodoroSession.Status status);
    
    @Query("SELECT COUNT(p) FROM PomodoroSession p WHERE p.user.id = :userId AND p.status = 'FINISHED'")
    Long countFinishedByUserId(@Param("userId") Long userId);
    
    @Query("SELECT COUNT(p) FROM PomodoroSession p WHERE p.user.id = :userId AND p.status = 'FINISHED' AND p.endAt >= :startOfWeek")
    Long countFinishedThisWeekByUserId(@Param("userId") Long userId, @Param("startOfWeek") LocalDateTime startOfWeek);
    
    @Query("SELECT SUM(p.durationSeconds) FROM PomodoroSession p WHERE p.user.id = :userId AND p.status = 'FINISHED'")
    Long sumDurationSecondsByUserId(@Param("userId") Long userId);
    
    @Query("SELECT SUM(p.durationSeconds) FROM PomodoroSession p WHERE p.user.id = :userId AND p.status IN ('FINISHED', 'ABORTED') AND p.endAt >= :startDate AND p.endAt <= :endDate AND p.durationSeconds >= 60")
    Long sumDurationSecondsByUserIdAndDateRange(@Param("userId") Long userId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT p FROM PomodoroSession p WHERE p.user.id = :userId AND p.status = 'FINISHED' AND p.endAt >= :startDate AND p.endAt < :endDate")
    List<PomodoroSession> findByUserIdAndDateRange(@Param("userId") Long userId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}
