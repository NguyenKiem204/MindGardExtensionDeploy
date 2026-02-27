package com.kiemnv.MindGardAPI.service;

import com.kiemnv.MindGardAPI.entity.OnboardingState;
import com.kiemnv.MindGardAPI.entity.User;
import com.kiemnv.MindGardAPI.repository.OnboardingRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class OnboardingService {

    private final OnboardingRepository onboardingRepository;

    public OnboardingState getForUser(User user) {
        return onboardingRepository.findByUserId(user.getId()).orElse(null);
    }

    @Transactional
    public OnboardingState upsert(User user, OnboardingState state) {
        OnboardingState s = onboardingRepository.findByUserId(user.getId()).orElseGet(() -> OnboardingState.builder().user(user).createdAt(LocalDateTime.now()).build());
        if (state.getCompletedStepsJson() != null) s.setCompletedStepsJson(state.getCompletedStepsJson());
        if (state.getHasCompleted() != null) s.setHasCompleted(state.getHasCompleted());
        if (state.getUserName() != null) s.setUserName(state.getUserName());
        if (state.getWorkMin() != null) s.setWorkMin(state.getWorkMin());
        if (state.getBreakMin() != null) s.setBreakMin(state.getBreakMin());
        if (state.getBackground() != null) s.setBackground(state.getBackground());
        if (state.getAutoBackground() != null) s.setAutoBackground(state.getAutoBackground());
        if (state.getDefaultEffect() != null) s.setDefaultEffect(state.getDefaultEffect());
        return onboardingRepository.save(s);
    }
}
