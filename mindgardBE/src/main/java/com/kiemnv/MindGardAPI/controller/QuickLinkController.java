package com.kiemnv.MindGardAPI.controller;

import com.kiemnv.MindGardAPI.dto.request.QuickLinkRequest;
import com.kiemnv.MindGardAPI.dto.response.ApiResponse;
import com.kiemnv.MindGardAPI.dto.response.QuickLinkDto;
import com.kiemnv.MindGardAPI.entity.QuickLink;
import com.kiemnv.MindGardAPI.entity.User;
import com.kiemnv.MindGardAPI.service.QuickLinkService;
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
@RequestMapping("/api/quicklinks")
@RequiredArgsConstructor
@Tag(name = "QuickLinks", description = "User quick links – FE: label, url, icon")
public class QuickLinkController {

    private final QuickLinkService quickLinkService;

    private static QuickLinkDto toDto(QuickLink q) {
        return QuickLinkDto.builder()
                .id(q.getId())
                .label(q.getTitle())
                .url(q.getUrl())
                .icon(q.getIcon())
                .ordering(q.getOrdering())
                .build();
    }

    private static QuickLink fromRequest(QuickLinkRequest r) {
        QuickLink q = new QuickLink();
        if (r != null) {
            if (r.getLabel() != null) q.setTitle(r.getLabel());
            if (r.getUrl() != null) q.setUrl(r.getUrl());
            if (r.getIcon() != null) q.setIcon(r.getIcon());
            if (r.getOrdering() != null) q.setOrdering(r.getOrdering());
        }
        return q;
    }

    @GetMapping
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "List quicklinks (paged)")
    public ResponseEntity<ApiResponse<Page<QuickLinkDto>>> list(Pageable pageable, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        Page<QuickLink> page = quickLinkService.list(user, pageable);
        return ResponseEntity.ok(ApiResponse.success(page.map(QuickLinkController::toDto), "QuickLinks retrieved"));
    }

    @GetMapping("/all")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "List all quicklinks (ordered) – FE: quickLinks array")
    public ResponseEntity<ApiResponse<List<QuickLinkDto>>> listAll(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<QuickLink> list = quickLinkService.listAll(user);
        return ResponseEntity.ok(ApiResponse.success(list.stream().map(QuickLinkController::toDto).collect(Collectors.toList()), "QuickLinks retrieved"));
    }

    @PostMapping
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Create quicklink (FE: label, url, icon)")
    public ResponseEntity<ApiResponse<QuickLinkDto>> create(@RequestBody QuickLinkRequest req, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        QuickLink q = fromRequest(req);
        if (q.getUrl() != null && !q.getUrl().startsWith("http")) q.setUrl("https://" + q.getUrl());
        QuickLink created = quickLinkService.create(user, q);
        return ResponseEntity.ok(ApiResponse.success(toDto(created), "QuickLink created"));
    }

    @PutMapping("/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update quicklink (FE: label, url, icon, ordering)")
    public ResponseEntity<ApiResponse<QuickLinkDto>> update(@PathVariable Long id, @RequestBody QuickLinkRequest req, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        QuickLink update = fromRequest(req);
        QuickLink q = quickLinkService.update(id, user, update);
        return ResponseEntity.ok(ApiResponse.success(toDto(q), "QuickLink updated"));
    }

    @DeleteMapping("/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Delete quicklink")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        quickLinkService.delete(id, user);
        return ResponseEntity.ok(ApiResponse.success(null, "QuickLink deleted"));
    }
}
