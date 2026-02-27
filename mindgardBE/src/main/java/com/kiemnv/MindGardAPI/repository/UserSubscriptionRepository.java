package com.kiemnv.MindGardAPI.repository;

import com.kiemnv.MindGardAPI.entity.UserSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, Long> {
    List<UserSubscription> findByUserId(Long userId);

    Optional<UserSubscription> findByUserIdAndStatus(Long userId, String status);

    List<UserSubscription> findByStatus(String status);
    
    // Find subscriptions that have expired before a certain date
    List<UserSubscription> findByEndDateBeforeAndStatus(LocalDateTime date, String status);

    // Find subscriptions whose end date falls between a range (for reminders)
    List<UserSubscription> findByEndDateBetweenAndStatus(LocalDateTime start, LocalDateTime end, String status);
}
