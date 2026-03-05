package com.kiemnv.MindGardAPI.repository;

import com.kiemnv.MindGardAPI.entity.Todo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TodoRepository extends JpaRepository<Todo, Long> {
    Page<Todo> findByUserId(Long userId, Pageable pageable);
    List<Todo> findByUserId(Long userId);
    List<Todo> findByUserIdAndCompleted(Long userId, boolean completed);
}
