package com.kiemnv.MindGardAPI.repository;

import com.kiemnv.MindGardAPI.entity.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {
    
    Optional<PaymentTransaction> findByProviderTransactionId(String providerTransactionId);
    
    Optional<PaymentTransaction> findByOrderCode(String orderCode);
    
    List<PaymentTransaction> findByUserId(Long userId);

    List<PaymentTransaction> findByStatus(String status);
}
