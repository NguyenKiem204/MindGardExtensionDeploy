package com.kiemnv.MindGardAPI.repository;

import com.kiemnv.MindGardAPI.entity.Scene;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SceneRepository extends JpaRepository<Scene, Long> {
    Page<Scene> findByUserId(Long userId, Pageable pageable);
    List<Scene> findByUserIdOrIsDefaultTrue(Long userId);
}
