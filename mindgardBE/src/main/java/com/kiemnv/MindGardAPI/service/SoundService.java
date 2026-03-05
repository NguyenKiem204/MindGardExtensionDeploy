package com.kiemnv.MindGardAPI.service;

import com.kiemnv.MindGardAPI.dto.response.MusicResponse;
import com.kiemnv.MindGardAPI.entity.Sound;
import com.kiemnv.MindGardAPI.entity.User;
import com.kiemnv.MindGardAPI.repository.SoundRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SoundService {

    private final SoundRepository soundRepository;

    /**
     * Predefined curated music list with standard audio URLs (not YouTube).
     */
    public List<MusicResponse> getMusicList() {
        List<MusicResponse> list = new ArrayList<>();

        list.add(MusicResponse.builder()
                .id("serene-view")
                .name("Serene View")
                .thumbnail("https://images.unsplash.com/photo-1494232410401-ad00d5433cfa?w=200&h=200&fit=crop")
                .src("https://assets.mixkit.co/music/443/443.mp3")
                .type("MP3")
                .category("Focus")
                .build());

        list.add(MusicResponse.builder()
                .id("sweet-september")
                .name("Sweet September")
                .thumbnail("https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200&h=200&fit=crop")
                .src("https://assets.mixkit.co/music/282/282.mp3")
                .type("MP3")
                .category("Focus")
                .build());

        list.add(MusicResponse.builder()
                .id("curiosity")
                .name("Curiosity")
                .thumbnail("https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=200&h=200&fit=crop")
                .src("https://assets.mixkit.co/music/480/480.mp3")
                .type("MP3")
                .category("Deep")
                .build());

        list.add(MusicResponse.builder()
                .id("sleepy-cat")
                .name("Sleepy Cat")
                .thumbnail("https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&h=200&fit=crop")
                .src("https://assets.mixkit.co/music/135/135.mp3")
                .type("MP3")
                .category("Classical")
                .build());

        list.add(MusicResponse.builder()
                .id("majestic")
                .name("Majestic")
                .thumbnail("https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=200&h=200&fit=crop")
                .src("https://assets.mixkit.co/music/475/475.mp3")
                .type("MP3")
                .category("Positive")
                .build());

        list.add(MusicResponse.builder()
                .id("pop-vibes")
                .name("Pop Vibes")
                .thumbnail("https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=200&h=200&fit=crop")
                .src("https://assets.mixkit.co/music/695/695.mp3")
                .type("MP3")
                .category("Positive")
                .build());

        return list;
    }

    public Page<Sound> list(User user, Pageable pageable) {
        return soundRepository.findByUserId(user.getId(), pageable);
    }

    public List<Sound> listAll(User user) {
        return soundRepository.findByUserIdOrUserIsNull(user.getId());
    }

    @Transactional
    public Sound create(User user, Sound s) {
        s.setUser(user);
        s.setCreatedAt(LocalDateTime.now());
        return soundRepository.save(s);
    }

    @Transactional
    public Sound update(Long id, User user, Sound update) {
        Sound s = soundRepository.findById(id)
                .filter(x -> x.getUser() == null || x.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new RuntimeException("Sound not found or not allowed"));
        if (update.getName() != null) s.setName(update.getName());
        if (update.getSrcUrl() != null) s.setSrcUrl(update.getSrcUrl());
        if (update.getVolumeDefault() != null) s.setVolumeDefault(update.getVolumeDefault());
        return soundRepository.save(s);
    }

    @Transactional
    public void delete(Long id, User user) {
        Sound s = soundRepository.findById(id)
                .filter(x -> x.getUser() == null || x.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new RuntimeException("Sound not found or not allowed"));
        soundRepository.delete(s);
    }
}
