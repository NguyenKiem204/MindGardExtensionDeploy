package com.kiemnv.MindGardAPI.service;

import com.kiemnv.MindGardAPI.dto.request.PomodoroRecordRequest;
import com.kiemnv.MindGardAPI.dto.response.FocusSessionDto;
import com.kiemnv.MindGardAPI.dto.response.FocusStatsDto;
import com.kiemnv.MindGardAPI.entity.PomodoroSession;
import com.kiemnv.MindGardAPI.entity.User;
import com.kiemnv.MindGardAPI.repository.PomodoroRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PomodoroService {

    private final PomodoroRepository pomodoroRepository;
    private final UserStatsService userStatsService;

    public Page<PomodoroSession> list(User user, Pageable pageable) {
        return pomodoroRepository.findByUserId(user.getId(), pageable);
    }

    /** FE extension: record completed or partial focus session (dateISO, durationMin, taskTitle, isPartial) */
    @Transactional
    public PomodoroSession record(User user, PomodoroRecordRequest req) {
        if (req == null || req.getDateISO() == null || req.getDurationMin() == null) {
            throw new IllegalArgumentException("dateISO and durationMin are required");
        }
        Instant endInstant = Instant.parse(req.getDateISO());
        LocalDateTime endAt = LocalDateTime.ofInstant(endInstant, ZoneId.of("UTC"));
        int durationMin = req.getDurationMin();
        LocalDateTime startAt = endAt.minusMinutes(durationMin);
        boolean isPartial = Boolean.TRUE.equals(req.getIsPartial());
        
        PomodoroSession s = PomodoroSession.builder()
                .user(user)
                .task(req.getTaskTitle() != null ? req.getTaskTitle() : "")
                .startAt(startAt)
                .endAt(endAt)
                .durationSeconds(durationMin * 60L)
                .status(isPartial ? PomodoroSession.Status.ABORTED : PomodoroSession.Status.FINISHED)
                .build();
        PomodoroSession saved = pomodoroRepository.save(s);
        
        // update stats + XP/level
        if (isPartial) {
            // Partial session: only time, XP, level, streak (no pomodoro count)
            userStatsService.applyPartialSession(user, endAt, durationMin * 60L);
        } else {
            // Completed session: full credit
            userStatsService.applyCompletedSession(user, endAt, durationMin * 60L);
        }
        return saved;
    }

    /** FE extension: list for Statistics / pomodoroStats (dateISO, durationMin, taskTitle) */
    public List<FocusSessionDto> listFocusSessions(User user) {
        List<PomodoroSession> list = pomodoroRepository.findTop1000ByUserIdAndStatusOrderByStartAtDesc(user.getId(), PomodoroSession.Status.FINISHED);
        return list.stream().map(p -> {
            String dateISO = p.getEndAt() != null
                    ? p.getEndAt().atZone(ZoneOffset.UTC).toInstant().toString()
                    : (p.getStartAt() != null && p.getDurationSeconds() != null
                    ? p.getStartAt().plusSeconds(p.getDurationSeconds()).atZone(ZoneOffset.UTC).toInstant().toString()
                    : null);
            Integer durationMin = p.getDurationSeconds() != null ? (int) (p.getDurationSeconds() / 60) : 0;
            return FocusSessionDto.builder()
                    .dateISO(dateISO)
                    .durationMin(durationMin)
                    .taskTitle(p.getTask() != null ? p.getTask() : "")
                    .build();
        }).collect(Collectors.toList());
    }

    /** FE extension: Statistics – streak and weekdayTotals (Sun–Sat) from focus sessions */
    public FocusStatsDto getFocusStats(User user) {
        List<FocusSessionDto> sessions = listFocusSessions(user);
        Set<String> days = sessions.stream()
                .map(d -> {
                    try {
                        return Instant.parse(d.getDateISO()).atZone(ZoneOffset.UTC).toLocalDate().toString();
                    } catch (Exception e) {
                        return null;
                    }
                })
                .filter(x -> x != null)
                .collect(Collectors.toSet());
        int streak = 0;
        for (int i = 0; ; i++) {
            String key = LocalDate.now().minusDays(i).toString();
            if (days.contains(key)) streak++;
            else break;
        }
        int[] totals = new int[7]; // 0=Sun, 1=Mon, ..., 6=Sat
        for (FocusSessionDto s : sessions) {
            try {
                int dow = Instant.parse(s.getDateISO()).atZone(ZoneOffset.UTC).toLocalDate().getDayOfWeek().getValue();
                int idx = dow == 7 ? 0 : dow; // Java Sun=7 -> FE 0
                totals[idx] += (s.getDurationMin() != null ? s.getDurationMin() : 0);
            } catch (Exception ignored) {}
        }
        List<Integer> weekdayTotals = new ArrayList<>();
        for (int t : totals) weekdayTotals.add(t);
        return FocusStatsDto.builder().streak(streak).weekdayTotals(weekdayTotals).build();
    }

    public PomodoroSession get(Long id, User user) {
        return pomodoroRepository.findById(id)
                .filter(p -> p.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new RuntimeException("Pomodoro not found"));
    }

    @Transactional
    public PomodoroSession start(User user, PomodoroSession req) {
        req.setUser(user);
        req.setStartAt(LocalDateTime.now());
        req.setStatus(PomodoroSession.Status.RUNNING);
        return pomodoroRepository.save(req);
    }

    @Transactional
    public PomodoroSession stop(Long id, User user, boolean interrupted) {
        PomodoroSession p = get(id, user);
        p.setEndAt(LocalDateTime.now());
        if (p.getStartAt() != null) {
            p.setDurationSeconds(java.time.Duration.between(p.getStartAt(), p.getEndAt()).getSeconds());
        }
        p.setStatus(interrupted ? PomodoroSession.Status.ABORTED : PomodoroSession.Status.FINISHED);
        PomodoroSession saved = pomodoroRepository.save(p);
        
        if (saved.getEndAt() != null && saved.getDurationSeconds() != null) {
            if (!interrupted) {
                // Completed session: full credit
                userStatsService.applyCompletedSession(user, saved.getEndAt(), saved.getDurationSeconds());
            } else {
                // Interrupted session: partial credit (time, XP, level, streak, but no pomodoro count)
                userStatsService.applyPartialSession(user, saved.getEndAt(), saved.getDurationSeconds());
            }
        }
        return saved;
    }
}
