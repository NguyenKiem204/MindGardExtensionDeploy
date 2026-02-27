package com.kiemnv.MindGardAPI.config;

import com.kiemnv.MindGardAPI.entity.SubscriptionPlan;
import com.kiemnv.MindGardAPI.repository.SubscriptionPlanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataSeederConfig {

    private final SubscriptionPlanRepository subscriptionPlanRepository;

    @Bean
    public CommandLineRunner initDatabase() {
        return args -> {
            log.info("Checking for existing subscription plans...");
            if (subscriptionPlanRepository.count() == 0) {
                log.info("No subscription plans found. Seeding initial data...");
                
                SubscriptionPlan monthlyPlan = new SubscriptionPlan();
                monthlyPlan.setCode("PLUS_1M");
                monthlyPlan.setName("MindGard Plus (1 Tháng)");
                monthlyPlan.setPrice(29000.0);
                monthlyPlan.setCurrency("VND");
                monthlyPlan.setDurationDays(30);
                monthlyPlan.setFeaturesJson("[\"Không quảng cáo\", \"Mở khóa toàn bộ Hình nền & Âm thanh Cao cấp\", \"Chế độ chặn xao nhãng bằng AI (AI Strict Focus)\", \"Phòng học chung (Shared Focus Rooms)\", \"Phân tích hiệu suất học tập nâng cao\"]");
                monthlyPlan.setIsActive(true);

                SubscriptionPlan yearlyPlan = new SubscriptionPlan();
                yearlyPlan.setCode("PLUS_1Y");
                yearlyPlan.setName("MindGard Plus (1 Năm)");
                yearlyPlan.setPrice(290000.0);
                yearlyPlan.setCurrency("VND");
                yearlyPlan.setDurationDays(365);
                yearlyPlan.setFeaturesJson("[\"Không quảng cáo\", \"Mở khóa toàn bộ Hình nền & Âm thanh Cao cấp\", \"Chế độ chặn xao nhãng bằng AI (AI Strict Focus)\", \"Phòng học chung (Shared Focus Rooms)\", \"Phân tích hiệu suất học tập nâng cao\", \"Tiết kiệm 17% so với gói tháng\"]");
                yearlyPlan.setIsActive(true);

                subscriptionPlanRepository.saveAll(List.of(monthlyPlan, yearlyPlan));
                log.info("Seeded initial subscription plans successfully.");
            } else {
                log.info("Subscription plans already exist. Skipping seed.");
            }
        };
    }
}
