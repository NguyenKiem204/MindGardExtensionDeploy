package com.kiemnv.MindGardAPI.repository;

import com.kiemnv.MindGardAPI.entity.DailyQuote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DailyQuoteRepository extends JpaRepository<DailyQuote, Long> {
    Optional<DailyQuote> findFirstByLocaleAndActiveTrue(String locale);
    java.util.List<DailyQuote> findByActiveTrue();
}
