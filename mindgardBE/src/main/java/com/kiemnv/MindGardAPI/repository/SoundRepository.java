package com.kiemnv.MindGardAPI.repository;

import com.kiemnv.MindGardAPI.entity.Sound;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SoundRepository extends JpaRepository<Sound, Long> {
    Page<Sound> findByUserId(Long userId, Pageable pageable);
    List<Sound> findByUserIdOrUserIsNull(Long userId);
}
