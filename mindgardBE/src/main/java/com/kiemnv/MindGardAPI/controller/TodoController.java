package com.kiemnv.MindGardAPI.controller;

import com.kiemnv.MindGardAPI.dto.request.TodoRequest;
import com.kiemnv.MindGardAPI.dto.response.ApiResponse;
import com.kiemnv.MindGardAPI.dto.response.TodoDto;
import com.kiemnv.MindGardAPI.entity.Todo;
import com.kiemnv.MindGardAPI.entity.User;
import com.kiemnv.MindGardAPI.service.TodoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/todos")
@RequiredArgsConstructor
@Tag(name = "Todos", description = "Todo management – matches FE extension (text, done)")
public class TodoController {

    private final TodoService todoService;

    private static TodoDto toDto(Todo t) {
        return TodoDto.builder()
                .id(t.getId())
                .text(t.getTitle())
                .done(t.isCompleted())
                .build();
    }

    @GetMapping
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "List user's todos (paged)")
    public ResponseEntity<ApiResponse<Page<TodoDto>>> list(Pageable pageable, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        Page<Todo> page = todoService.listUserTodos(user, pageable);
        return ResponseEntity.ok(ApiResponse.success(page.map(TodoController::toDto), "Todos retrieved"));
    }

    /** FE extension: full list without paging (like chrome.storage "todos") */
    @GetMapping("/all")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "List all todos for extension sync")
    public ResponseEntity<ApiResponse<List<TodoDto>>> listAll(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<Todo> list = todoService.listAllForUser(user);
        return ResponseEntity.ok(ApiResponse.success(list.stream().map(TodoController::toDto).collect(Collectors.toList()), "Todos retrieved"));
    }

    @PostMapping
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Create todo (FE: text, done)")
    public ResponseEntity<ApiResponse<TodoDto>> create(@RequestBody TodoRequest req, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        Todo t = new Todo();
        t.setTitle(req.getText() != null ? req.getText() : "");
        t.setCompleted(Boolean.TRUE.equals(req.getDone()));
        Todo created = todoService.create(user, t);
        return ResponseEntity.ok(ApiResponse.success(toDto(created), "Todo created"));
    }

    @GetMapping("/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get todo by id")
    public ResponseEntity<ApiResponse<TodoDto>> get(@PathVariable Long id, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        Todo t = todoService.getByIdAndUser(id, user);
        return ResponseEntity.ok(ApiResponse.success(toDto(t), "Todo retrieved"));
    }

    @PutMapping("/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update todo (FE: text, done)")
    public ResponseEntity<ApiResponse<TodoDto>> update(@PathVariable Long id, @RequestBody TodoRequest req, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        Todo update = new Todo();
        if (req.getText() != null) update.setTitle(req.getText());
        if (req.getDone() != null) update.setCompleted(req.getDone());
        Todo t = todoService.update(id, user, update);
        return ResponseEntity.ok(ApiResponse.success(toDto(t), "Todo updated"));
    }

    @DeleteMapping("/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Delete todo")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        todoService.delete(id, user);
        return ResponseEntity.ok(ApiResponse.success(null, "Todo deleted"));
    }
}
