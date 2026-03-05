package com.kiemnv.MindGardAPI.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    // Note: To use JavaMailSender, you need spring-boot-starter-mail dependency 
    // and spring.mail host/port/username/password config in application.yml
    private final JavaMailSender emailSender;

    public void sendSubscriptionReminder(String to, String planName, long daysRemaining) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("MindGard - Nhắc nhở gói " + planName + " sắp hết hạn");
            message.setText("Chào bạn,\n\n" +
                    "Gói đăng ký " + planName + " của bạn chỉ còn " + daysRemaining + " ngày nữa là hết hạn.\n" +
                    "Vui lòng nạp tiền và gia hạn để tiếp tục sử dụng các tính năng Premium và không bị gián đoạn.\n\n" +
                    "Trân trọng,\nĐội ngũ MindGard.");
            
            emailSender.send(message);
            log.info("Sent reminder email to {}", to);
        } catch (Exception e) {
            log.error("Failed to send reminder email to {}", to, e);
        }
    }
}
