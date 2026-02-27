package com.kiemnv.MindGardAPI.controller;

import com.kiemnv.MindGardAPI.dto.response.ApiResponse;
import com.kiemnv.MindGardAPI.dto.response.QuickNoteDto;
import com.kiemnv.MindGardAPI.entity.Note;
import com.kiemnv.MindGardAPI.entity.User;
import com.kiemnv.MindGardAPI.service.NoteService;
import com.kiemnv.MindGardAPI.service.SettingsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
@Tag(name = "Notes", description = "Note management. FE extension: quick = single quickNotes text.")
public class NoteController {

    private final NoteService noteService;
    private final SettingsService settingsService;

    /** FE extension: GET quickNotes (key "quickNotes") */
    @GetMapping("/quick")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get quick notes (FE: quickNotes)")
    public ResponseEntity<ApiResponse<QuickNoteDto>> getQuick(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        String content = settingsService.getQuickNotes(user);
        return ResponseEntity.ok(ApiResponse.success(QuickNoteDto.builder().content(content != null ? content : "").build(), "Quick notes retrieved"));
    }

    /** FE extension: PUT quickNotes. Body: { "content": "..." } */
    @PutMapping("/quick")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update quick notes (FE: quickNotes)")
    public ResponseEntity<ApiResponse<QuickNoteDto>> putQuick(@RequestBody Map<String, String> body, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        String content = "";
        if (body != null) {
            if (body.containsKey("content")) content = body.get("content") != null ? body.get("content") : "";
            else if (body.containsKey("quickNotes")) content = body.get("quickNotes") != null ? body.get("quickNotes") : "";
        }
        settingsService.updateQuickNotes(user, content);
        return ResponseEntity.ok(ApiResponse.success(QuickNoteDto.builder().content(content != null ? content : "").build(), "Quick notes updated"));
    }

    @GetMapping
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "List user's notes")
    public ResponseEntity<ApiResponse<Page<Note>>> list(Pageable pageable, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        Page<Note> page = noteService.list(user, pageable);
        return ResponseEntity.ok(ApiResponse.success(page, "Notes retrieved"));
    }

    @PostMapping
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Create note")
    public ResponseEntity<ApiResponse<Note>> create(@RequestBody Note note, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        Note created = noteService.create(user, note);
        return ResponseEntity.ok(ApiResponse.success(created, "Note created"));
    }

    @GetMapping("/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get note by id")
    public ResponseEntity<ApiResponse<Note>> get(@PathVariable Long id, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        Note n = noteService.get(id, user);
        return ResponseEntity.ok(ApiResponse.success(n, "Note retrieved"));
    }

    @PutMapping("/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update note")
    public ResponseEntity<ApiResponse<Note>> update(@PathVariable Long id, @RequestBody Note update, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        Note n = noteService.update(id, user, update);
        return ResponseEntity.ok(ApiResponse.success(n, "Note updated"));
    }

    @DeleteMapping("/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Delete note")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        noteService.delete(id, user);
        return ResponseEntity.ok(ApiResponse.success(null, "Note deleted"));
    }
}
