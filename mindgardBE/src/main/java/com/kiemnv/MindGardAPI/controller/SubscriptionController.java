package com.kiemnv.MindGardAPI.controller;

import com.kiemnv.MindGardAPI.dto.request.CreatePaymentRequest;
import com.kiemnv.MindGardAPI.dto.response.PaymentUrlResponse;
import com.kiemnv.MindGardAPI.dto.response.SubscriptionInfoResponse;
import com.kiemnv.MindGardAPI.entity.SubscriptionPlan;
import com.kiemnv.MindGardAPI.entity.User;
import com.kiemnv.MindGardAPI.service.PaymentService;
import com.kiemnv.MindGardAPI.service.SubscriptionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/subscriptions")
@RequiredArgsConstructor
@Tag(name = "Subscription & Payments", description = "Endpoints for managing freemium plans and upgrades")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;
    private final PaymentService paymentService;

    @GetMapping("/plans")
    @Operation(summary = "Get list of active subscription plans (Month, Year)")
    public ResponseEntity<List<SubscriptionPlan>> getActivePlans() {
        return ResponseEntity.ok(subscriptionService.getActivePlans());
    }

    @GetMapping("/me")
    @Operation(summary = "Get current active subscription for logged-in user")
    public ResponseEntity<SubscriptionInfoResponse> getCurrentSubscription(@AuthenticationPrincipal User user) {
        SubscriptionInfoResponse response = subscriptionService.getCurrentSubscription(user.getId());
        if (response == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/buy")
    @Operation(summary = "Generate a payment link to upgrade to PLUS")
    public ResponseEntity<PaymentUrlResponse> createPaymentUrl(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreatePaymentRequest request) {
        return ResponseEntity.ok(paymentService.createPaymentUrl(user, request));
    }

    // Webhook from SePay (Does not require Auth Header)
    @PostMapping("/sepay-webhook")
    @Operation(summary = "Endpoint to handle payment gateway Webhook from SePay")
    public ResponseEntity<Map<String, Object>> sepayWebhookCallback(@RequestBody Map<String, Object> payload) {
        paymentService.handleSepayWebhook(payload);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // Polling endpoint for frontend
    @GetMapping("/status/{orderCode}")
    @Operation(summary = "Check payment status by order code (for Frontend AJAX Polling)")
    public ResponseEntity<Map<String, String>> checkPaymentStatus(@PathVariable String orderCode) {
        String status = paymentService.checkPaymentStatus(orderCode);
        return ResponseEntity.ok(Map.of("status", status));
    }
}
