package com.kiemnv.MindGardAPI.service;

import com.kiemnv.MindGardAPI.entity.QuickLink;
import com.kiemnv.MindGardAPI.entity.User;
import com.kiemnv.MindGardAPI.repository.QuickLinkRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class QuickLinkService {

    private final QuickLinkRepository quickLinkRepository;

    public Page<QuickLink> list(User user, Pageable pageable) {
        return quickLinkRepository.findByUserId(user.getId(), pageable);
    }

    public List<QuickLink> listAll(User user) {
        return quickLinkRepository.findByUserIdOrderByOrdering(user.getId());
    }

    @Transactional
    public QuickLink create(User user, QuickLink q) {
        q.setUser(user);
        q.setCreatedAt(LocalDateTime.now());
        if (q.getOrdering() == null) {
            int next = listAll(user).stream()
                    .mapToInt(x -> x.getOrdering() != null ? x.getOrdering() : 0)
                    .max().orElse(-1) + 1;
            q.setOrdering(next);
        }
        return quickLinkRepository.save(q);
    }

    @Transactional
    public QuickLink update(Long id, User user, QuickLink update) {
        QuickLink q = quickLinkRepository.findById(id)
                .filter(x -> x.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new RuntimeException("QuickLink not found"));
        if (update.getTitle() != null) q.setTitle(update.getTitle());
        if (update.getUrl() != null) q.setUrl(update.getUrl());
        if (update.getIcon() != null) q.setIcon(update.getIcon());
        if (update.getOrdering() != null) q.setOrdering(update.getOrdering());
        return quickLinkRepository.save(q);
    }

    @Transactional
    public void delete(Long id, User user) {
        QuickLink q = quickLinkRepository.findById(id)
                .filter(x -> x.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new RuntimeException("QuickLink not found"));
        quickLinkRepository.delete(q);
    }
}
