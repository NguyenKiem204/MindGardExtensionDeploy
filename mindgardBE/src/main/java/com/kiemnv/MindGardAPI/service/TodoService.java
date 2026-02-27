package com.kiemnv.MindGardAPI.service;

import com.kiemnv.MindGardAPI.entity.Todo;
import com.kiemnv.MindGardAPI.entity.User;
import com.kiemnv.MindGardAPI.repository.TodoRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TodoService {

    private final TodoRepository todoRepository;

    public Page<Todo> listUserTodos(User user, Pageable pageable) {
        return todoRepository.findByUserId(user.getId(), pageable);
    }

    public List<Todo> listAllForUser(User user) {
        return todoRepository.findByUserId(user.getId());
    }

    public Todo getByIdAndUser(Long id, User user) {
        return todoRepository.findById(id)
                .filter(t -> t.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new RuntimeException("Todo not found"));
    }

    @Transactional
    public Todo create(User user, Todo todo) {
        todo.setUser(user);
        todo.setCreatedAt(LocalDateTime.now());
        todo.setUpdatedAt(LocalDateTime.now());
        return todoRepository.save(todo);
    }

    @Transactional
    public Todo update(Long id, User user, Todo update) {
        Todo t = getByIdAndUser(id, user);
        if (update.getTitle() != null) t.setTitle(update.getTitle());
        if (update.getNotes() != null) t.setNotes(update.getNotes());
        if (update.getDueAt() != null) t.setDueAt(update.getDueAt());
        if (update.getPriority() != null) t.setPriority(update.getPriority());
        t.setCompleted(update.isCompleted());
        t.setUpdatedAt(LocalDateTime.now());
        return todoRepository.save(t);
    }

    @Transactional
    public void delete(Long id, User user) {
        Todo t = getByIdAndUser(id, user);
        todoRepository.delete(t);
    }
}
