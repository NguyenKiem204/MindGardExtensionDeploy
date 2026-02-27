package com.kiemnv.MindGardAPI.service;

import com.kiemnv.MindGardAPI.entity.Settings;
import com.kiemnv.MindGardAPI.entity.User;
import com.kiemnv.MindGardAPI.repository.SettingsRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class SettingsService {

    private final SettingsRepository settingsRepository;

    public Settings getForUser(User user) {
        return settingsRepository.findByUserId(user.getId()).orElseGet(() -> {
            Settings s = Settings.builder()
                    .user(user).timezone("UTC").theme("light").pomodoroDefaults("{}")
                    .notifications(true).syncEnabled(false)
                    .workMin(25).breakMin(5).defaultEffect("rain").background("")
                    .build();
            return settingsRepository.save(s);
        });
    }

    @Transactional
    public Settings update(User user, Settings update) {
        Settings s = getForUser(user);
        if (update.getTimezone() != null) s.setTimezone(update.getTimezone());
        if (update.getTheme() != null) s.setTheme(update.getTheme());
        if (update.getPomodoroDefaults() != null) s.setPomodoroDefaults(update.getPomodoroDefaults());
        if (update.getNotifications() != null) s.setNotifications(update.getNotifications());
        if (update.getSyncEnabled() != null) s.setSyncEnabled(update.getSyncEnabled());
        if (update.getWorkMin() != null) s.setWorkMin(update.getWorkMin());
        if (update.getBreakMin() != null) s.setBreakMin(update.getBreakMin());
        if (update.getDefaultEffect() != null) s.setDefaultEffect(update.getDefaultEffect());
        if (update.getBackground() != null) s.setBackground(update.getBackground());
        if (update.getQuickNotes() != null) s.setQuickNotes(update.getQuickNotes());
        if (update.getAllowedDomains() != null) s.setAllowedDomains(update.getAllowedDomains());
        if (update.getFocusModeType() != null) s.setFocusModeType(update.getFocusModeType());
        if (update.getAiStrictnessLevel() != null) s.setAiStrictnessLevel(update.getAiStrictnessLevel());
        s.setUpdatedAt(LocalDateTime.now());
        return settingsRepository.save(s);
    }

    @Transactional
    public String getQuickNotes(User user) {
        return getForUser(user).getQuickNotes();
    }

    @Transactional
    public void updateQuickNotes(User user, String content) {
        Settings s = getForUser(user);
        s.setQuickNotes(content != null ? content : "");
        s.setUpdatedAt(LocalDateTime.now());
        settingsRepository.save(s);
    }
}
