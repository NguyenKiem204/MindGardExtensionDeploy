package com.kiemnv.MindGardAPI.service;

import com.kiemnv.MindGardAPI.entity.User;
import com.kiemnv.MindGardAPI.entity.WeatherPref;
import com.kiemnv.MindGardAPI.repository.WeatherPrefRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class WeatherPrefService {

    private final WeatherPrefRepository weatherPrefRepository;

    public WeatherPref getForUser(User user) {
        return weatherPrefRepository.findByUserId(user.getId()).orElse(null);
    }

    @Transactional
    public WeatherPref upsert(User user, WeatherPref pref) {
        WeatherPref p = weatherPrefRepository.findByUserId(user.getId()).orElseGet(() -> WeatherPref.builder().user(user).createdAt(LocalDateTime.now()).build());
        if (pref.getLocation() != null) p.setLocation(pref.getLocation());
        if (pref.getUnits() != null) p.setUnits(pref.getUnits());
        return weatherPrefRepository.save(p);
    }
}
