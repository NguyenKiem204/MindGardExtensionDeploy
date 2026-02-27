package com.kiemnv.MindGardAPI.service;

import com.kiemnv.MindGardAPI.entity.Note;
import com.kiemnv.MindGardAPI.entity.User;
import com.kiemnv.MindGardAPI.repository.NoteRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class NoteService {

    private final NoteRepository noteRepository;

    public Page<Note> list(User user, Pageable pageable) {
        return noteRepository.findByUserId(user.getId(), pageable);
    }

    public Note get(Long id, User user) {
        return noteRepository.findById(id)
                .filter(n -> n.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new RuntimeException("Note not found"));
    }

    @Transactional
    public Note create(User user, Note note) {
        note.setUser(user);
        note.setCreatedAt(LocalDateTime.now());
        note.setUpdatedAt(LocalDateTime.now());
        return noteRepository.save(note);
    }

    @Transactional
    public Note update(Long id, User user, Note update) {
        Note n = get(id, user);
        if (update.getTitle() != null) n.setTitle(update.getTitle());
        if (update.getContent() != null) n.setContent(update.getContent());
        n.setPinned(update.isPinned());
        n.setUpdatedAt(LocalDateTime.now());
        return noteRepository.save(n);
    }

    @Transactional
    public void delete(Long id, User user) {
        Note n = get(id, user);
        noteRepository.delete(n);
    }
}
