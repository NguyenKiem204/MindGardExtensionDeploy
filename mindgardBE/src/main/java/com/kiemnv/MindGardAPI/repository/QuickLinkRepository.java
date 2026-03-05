package com.kiemnv.MindGardAPI.repository;

import com.kiemnv.MindGardAPI.entity.QuickLink;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuickLinkRepository extends JpaRepository<QuickLink, Long> {
    Page<QuickLink> findByUserId(Long userId, Pageable pageable);
    List<QuickLink> findByUserIdOrderByOrdering(Long userId);
}
