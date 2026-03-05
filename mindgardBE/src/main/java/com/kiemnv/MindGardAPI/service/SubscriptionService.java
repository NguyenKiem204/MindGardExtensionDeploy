package com.kiemnv.MindGardAPI.service;

import com.kiemnv.MindGardAPI.dto.response.SubscriptionInfoResponse;
import com.kiemnv.MindGardAPI.entity.PaymentTransaction;
import com.kiemnv.MindGardAPI.entity.Role;
import com.kiemnv.MindGardAPI.entity.SubscriptionPlan;
import com.kiemnv.MindGardAPI.entity.User;
import com.kiemnv.MindGardAPI.entity.UserSubscription;
import com.kiemnv.MindGardAPI.repository.SubscriptionPlanRepository;
import com.kiemnv.MindGardAPI.repository.UserRepository;
import com.kiemnv.MindGardAPI.repository.UserSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubscriptionService {

    private final SubscriptionPlanRepository planRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public List<SubscriptionPlan> getActivePlans() {
        return planRepository.findByIsActiveTrue();
    }

    public SubscriptionInfoResponse getCurrentSubscription(Long userId) {
        Optional<UserSubscription> activeSub = userSubscriptionRepository.findByUserIdAndStatus(userId, "ACTIVE");
        
        if (activeSub.isEmpty()) {
            return null; // Return empty/null response if no active sub
        }
        
        UserSubscription sub = activeSub.get();
        long daysRemaining = ChronoUnit.DAYS.between(LocalDateTime.now(), sub.getEndDate());
        
        return SubscriptionInfoResponse.builder()
                .subscriptionId(sub.getId())
                .planName(sub.getPlan().getName())
                .planCode(sub.getPlan().getCode())
                .startDate(sub.getStartDate())
                .endDate(sub.getEndDate())
                .status(sub.getStatus())
                .daysRemaining(Math.max(0, daysRemaining))
                .build();
    }

    @Transactional
    public void processSuccessfulPayment(PaymentTransaction transaction) {
        User user = transaction.getUser();
        
        // Find the requested plan (assume transaction stored the plan logic via UserSubscription pending or metadata)
        // Here we require the logic to create UserSubscription on payment success. 
        // For simplicity, we get the pending subscription linked to the transaction.
        UserSubscription pendingSub = transaction.getUserSubscription();
        if (pendingSub != null) {
            pendingSub.setStatus("ACTIVE");
            pendingSub.setStartDate(LocalDateTime.now());
            pendingSub.setEndDate(LocalDateTime.now().plusDays(pendingSub.getPlan().getDurationDays()));
            userSubscriptionRepository.save(pendingSub);
            
            // Re-fetch user to avoid detached entity problems
            User updateableUser = userRepository.findById(user.getId()).orElse(user);
            updateableUser.getRoles().add(Role.PLUS);
            userRepository.save(updateableUser);
            
            log.info("Upgraded user {} to PLUS due to successful payment TX: {}", user.getUsername(), transaction.getId());
        }
    }

    // Runs every midnight to check expired subscriptions
    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void checkAndExpireSubscriptions() {
        log.info("Running daily check for expired subscriptions...");
        LocalDateTime now = LocalDateTime.now();
        
        List<UserSubscription> expiredSubs = userSubscriptionRepository.findByEndDateBeforeAndStatus(now, "ACTIVE");
        for (UserSubscription sub : expiredSubs) {
            sub.setStatus("EXPIRED");
            userSubscriptionRepository.save(sub);
            
            User user = sub.getUser();
            user.getRoles().remove(Role.PLUS); // Remove PLUS role
            userRepository.save(user);
            
            log.info("Subscription {} for user {} has EXPIRED. Removed PLUS role.", sub.getId(), user.getUsername());
        }
    }

    // Runs every day at 10 AM to send email reminders
    @Scheduled(cron = "0 0 10 * * ?")
    @Transactional(readOnly = true)
    public void notifyExpiringSubscriptions() {
        log.info("Scanning for expiring subscriptions to send reminders...");
        LocalDateTime now = LocalDateTime.now();
        
        // Check for 3 days reminder
        LocalDateTime start3Days = now.plusDays(3).withHour(0).withMinute(0);
        LocalDateTime end3Days = start3Days.plusDays(1);
        List<UserSubscription> expIn3Days = userSubscriptionRepository.findByEndDateBetweenAndStatus(start3Days, end3Days, "ACTIVE");
        
        for (UserSubscription sub : expIn3Days) {
            if (sub.getUser().getEmail() != null) {
                emailService.sendSubscriptionReminder(sub.getUser().getEmail(), sub.getPlan().getName(), 3);
            }
        }
        
        // Check for 1 day reminder
        LocalDateTime start1Day = now.plusDays(1).withHour(0).withMinute(0);
        LocalDateTime end1Day = start1Day.plusDays(1);
        List<UserSubscription> expIn1Day = userSubscriptionRepository.findByEndDateBetweenAndStatus(start1Day, end1Day, "ACTIVE");
        
        for (UserSubscription sub : expIn1Day) {
            if (sub.getUser().getEmail() != null) {
                emailService.sendSubscriptionReminder(sub.getUser().getEmail(), sub.getPlan().getName(), 1);
            }
        }
    }
}
