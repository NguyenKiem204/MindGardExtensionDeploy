package com.kiemnv.MindGardAPI.service;

import com.kiemnv.MindGardAPI.dto.request.CreatePaymentRequest;
import com.kiemnv.MindGardAPI.dto.response.PaymentUrlResponse;
import com.kiemnv.MindGardAPI.entity.PaymentTransaction;
import com.kiemnv.MindGardAPI.entity.SubscriptionPlan;
import com.kiemnv.MindGardAPI.entity.User;
import com.kiemnv.MindGardAPI.entity.UserSubscription;
import com.kiemnv.MindGardAPI.repository.PaymentTransactionRepository;
import com.kiemnv.MindGardAPI.repository.SubscriptionPlanRepository;
import com.kiemnv.MindGardAPI.repository.UserSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final SubscriptionPlanRepository planRepository;
    private final PaymentTransactionRepository transactionRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;
    private final SubscriptionService subscriptionService;

    @Value("${sepay.merchant-id:''}")
    private String merchantId;

    @Value("${sepay.secret-key:''}")
    private String webhookSecret;

    @Value("${sepay.bank-account:''}")
    private String bankAccount;

    @Value("${sepay.bank-name:''}")
    private String bankName;

    @Transactional
    public PaymentUrlResponse createPaymentUrl(User user, CreatePaymentRequest request) {
        SubscriptionPlan plan = planRepository.findById(request.getPlanId())
                .orElseThrow(() -> new RuntimeException("Plan not found"));

        String orderCode = "MG" + user.getId() + UUID.randomUUID().toString().substring(0, 5).toUpperCase();

        UserSubscription pendingSub = UserSubscription.builder()
                .user(user)
                .plan(plan)
                .startDate(LocalDateTime.now())
                .endDate(LocalDateTime.now())
                .status("PENDING")
                .build();
        userSubscriptionRepository.save(pendingSub);
        PaymentTransaction transaction = PaymentTransaction.builder()
                .user(user)
                .userSubscription(pendingSub)
                .amount(plan.getPrice())
                .paymentMethod("SEPAY")
                .orderCode(orderCode)
                .status("PENDING")
                .build();
        transactionRepository.save(transaction);

        String qrUrl = String.format("https://qr.sepay.vn/img?acc=%s&bank=%s&amount=%d&des=%s",
                bankAccount, bankName, plan.getPrice().longValue(), orderCode);

        return PaymentUrlResponse.builder()
                .qrUrl(qrUrl)
                .orderCode(orderCode)
                .amount(plan.getPrice())
                .bankAccount(bankAccount)
                .bankName(bankName)
                .build();
    }

    public String checkPaymentStatus(String orderCode) {
        Optional<PaymentTransaction> txOpt = transactionRepository.findByOrderCode(orderCode);
        return txOpt.map(PaymentTransaction::getStatus).orElse("NOT_FOUND");
    }

    @Transactional
    public void handleSepayWebhook(Map<String, Object> payload) {
        log.info("Received SePay IPN webhook: {}", payload);

        if (payload == null) {
            log.warn("Ignored. Payload is null.");
            return;
        }

        String providerTxId;
        String extractedOrderCode;
        double transferAmount;

        // Xử lý Webhook cơ bản ("Có tiền vào")
        if (payload.containsKey("transferAmount") && payload.containsKey("id")) {
            providerTxId = String.valueOf(payload.get("id"));
            extractedOrderCode = String.valueOf(payload.get("code"));
            
            // Fallback content parsing nếu 'code' không có
            if (extractedOrderCode == null || extractedOrderCode.equals("null") || extractedOrderCode.trim().isEmpty()) {
                String content = String.valueOf(payload.get("content"));
                Matcher matcher = Pattern.compile("(MG[a-zA-Z0-9]+)").matcher(content);
                if (matcher.find()) {
                    extractedOrderCode = matcher.group(1);
                } else {
                    extractedOrderCode = content;
                }
            }
            
            try {
                transferAmount = Double.parseDouble(String.valueOf(payload.get("transferAmount")));
            } catch (NumberFormatException e) {
                log.warn("Failed to parse transferAmount", e);
                return;
            }
        } 
        // Xử lý IPN Checkout ("ORDER_PAID")
        else if ("ORDER_PAID".equals(payload.get("notification_type"))) {
            Map<String, Object> orderMap = (Map<String, Object>) payload.get("order");
            Map<String, Object> txMap = (Map<String, Object>) payload.get("transaction");

            if (orderMap == null || txMap == null) {
                log.warn("Invalid payload structure, missing order or transaction block.");
                return;
            }
            providerTxId = String.valueOf(txMap.get("transaction_id"));
            extractedOrderCode = String.valueOf(orderMap.get("order_invoice_number"));
            try {
                transferAmount = Double.parseDouble(String.valueOf(txMap.get("transaction_amount")));
            } catch (NumberFormatException e) {
                log.warn("Failed to parse transaction_amount", e);
                return;
            }
        } 
        else {
            log.warn("Ignored. Invalid or unsupported webhook payload type.");
            return;
        }

        // Anti-duplicate check
        if (transactionRepository.findByProviderTransactionId(providerTxId).isPresent()) {
            log.info("Webhook duplicate ignored for SePay ID: {}", providerTxId);
            return;
        }

        Optional<PaymentTransaction> txOpt = transactionRepository.findByOrderCode(extractedOrderCode);
        if (txOpt.isEmpty()) {
            log.warn("Received webhook for an unknown order_code: {}", extractedOrderCode);
            return;
        }

        PaymentTransaction transaction = txOpt.get();

        if ("SUCCESS".equals(transaction.getStatus())) {
            log.info("Transaction {} already successful.", extractedOrderCode);
            return;
        }

        if (transferAmount >= transaction.getAmount()) {
            transaction.setStatus("SUCCESS");
            transaction.setProviderTransactionId(providerTxId);
            transaction.setCompletedAt(LocalDateTime.now());
            transactionRepository.save(transaction);
            
            log.info("Payment success for order: {}. Upgrading user...", extractedOrderCode);
            subscriptionService.processSuccessfulPayment(transaction);
        } else {
            log.warn("Underpaid transaction! Expected: {}, Received: {}", transaction.getAmount(), transferAmount);
            transaction.setStatus("FAILED");
            transaction.setProviderTransactionId(providerTxId);
            transaction.setCompletedAt(LocalDateTime.now());
            transactionRepository.save(transaction);
            
            UserSubscription sub = transaction.getUserSubscription();
            if (sub != null && "PENDING".equals(sub.getStatus())) {
                sub.setStatus("CANCELLED");
                userSubscriptionRepository.save(sub);
            }
        }
    }
}
