package com.kiemnv.MindGardAPI.repository;

import com.kiemnv.MindGardAPI.entity.WeatherPref;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WeatherPrefRepository extends JpaRepository<WeatherPref, Long> {
    Optional<WeatherPref> findByUserId(Long userId);
}
