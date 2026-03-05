package com.kiemnv.MindGardAPI.repository;

import com.kiemnv.MindGardAPI.entity.OnboardingState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OnboardingRepository extends JpaRepository<OnboardingState, Long> {
    Optional<OnboardingState> findByUserId(Long userId);
}
