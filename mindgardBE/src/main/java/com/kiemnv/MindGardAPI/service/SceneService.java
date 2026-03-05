package com.kiemnv.MindGardAPI.service;

import com.kiemnv.MindGardAPI.entity.Scene;
import com.kiemnv.MindGardAPI.entity.User;
import com.kiemnv.MindGardAPI.repository.SceneRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SceneService {

    private final SceneRepository sceneRepository;

    public Page<Scene> list(User user, Pageable pageable) {
        return sceneRepository.findByUserId(user.getId(), pageable);
    }

    public List<Scene> listAll(User user) {
        return sceneRepository.findByUserIdOrIsDefaultTrue(user.getId());
    }

    @Transactional
    public Scene create(User user, Scene s) {
        s.setUser(user);
        s.setCreatedAt(LocalDateTime.now());
        return sceneRepository.save(s);
    }

    @Transactional
    public Scene update(Long id, User user, Scene update) {
        Scene s = sceneRepository.findById(id)
                .filter(x -> x.getUser() == null || x.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new RuntimeException("Scene not found or not allowed"));
        if (update.getName() != null) s.setName(update.getName());
        if (update.getSettingsJson() != null) s.setSettingsJson(update.getSettingsJson());
        s.setDefault(update.isDefault());
        return sceneRepository.save(s);
    }

    @Transactional
    public void delete(Long id, User user) {
        Scene s = sceneRepository.findById(id)
                .filter(x -> x.getUser() == null || x.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new RuntimeException("Scene not found or not allowed"));
        sceneRepository.delete(s);
    }
}
