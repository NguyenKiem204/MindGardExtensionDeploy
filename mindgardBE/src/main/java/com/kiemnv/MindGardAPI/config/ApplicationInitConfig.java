package com.kiemnv.MindGardAPI.config;

import com.kiemnv.MindGardAPI.entity.Role;
import com.kiemnv.MindGardAPI.entity.SubscriptionPlan;
import com.kiemnv.MindGardAPI.entity.User;
import com.kiemnv.MindGardAPI.entity.UserSubscription;
import com.kiemnv.MindGardAPI.repository.SubscriptionPlanRepository;
import com.kiemnv.MindGardAPI.repository.UserRepository;
import com.kiemnv.MindGardAPI.repository.UserSubscriptionRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Slf4j
@Configuration
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ApplicationInitConfig {
    private PasswordEncoder passwordEncoder;

    @Bean
    ApplicationRunner applicationRunner(UserRepository userRepository, 
                                        SubscriptionPlanRepository planRepository, 
                                        UserSubscriptionRepository userSubscriptionRepository) {
        return args -> {
            if (userRepository.findByUsername("admin").isEmpty()) {
                var roles = new HashSet<String>();
                roles.add(Role.ADMIN.name());
                User user = User.builder()
                        .username("admin")
                        .password(passwordEncoder.encode("admin"))
                        .email("nkiem347@gmail.com")
                        .roles(Set.of(Role.ADMIN))
                        .build();
                User user1 = User.builder()
                        .username("user")
                        .password(passwordEncoder.encode("user"))
                        .email("nkiem348@gmail.com")
                        .roles(Set.of(Role.USER))
                        .build();
                userRepository.save(user);
                userRepository.save(user1);
                log.warn("admin user has bean create with default password: admin, please change it");
            }

            User plusUser = userRepository.findByUsername("plususer").orElseGet(() -> {
                User newUser = User.builder()
                        .username("plususer")
                        .password(passwordEncoder.encode("plususer"))
                        .email("plususer@gmail.com")
                        .roles(Set.of(Role.PLUS)) 
                        .build();
                return userRepository.save(newUser);
            });

            if (userSubscriptionRepository.findByUserId(plusUser.getId()).isEmpty()) {
                SubscriptionPlan yearlyPlan = planRepository.findByCode("PLUS_1Y").orElse(null);
                if (yearlyPlan != null) {
                    UserSubscription sub = UserSubscription.builder()
                            .user(plusUser)
                            .plan(yearlyPlan)
                            .startDate(LocalDateTime.now())
                            .endDate(LocalDateTime.now().plusDays(365))
                            .status("ACTIVE")
                            .build();
                    userSubscriptionRepository.save(sub);
                    log.info("Created test user 'plususer'/'plususer' with 1-year PLUS subscription.");
                } else {
                    log.warn("Could not find PLUS_1Y plan. Please ensure DataSeederConfig runs first.");
                }
            }
        };
    }

}

