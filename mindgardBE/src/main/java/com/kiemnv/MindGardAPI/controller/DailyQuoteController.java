package com.kiemnv.MindGardAPI.controller;

import com.kiemnv.MindGardAPI.dto.response.ApiResponse;
import com.kiemnv.MindGardAPI.entity.DailyQuote;
import com.kiemnv.MindGardAPI.repository.DailyQuoteRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.Random;

@RestController
@RequestMapping("/api/quotes")
@RequiredArgsConstructor
@Tag(name = "Quotes", description = "Daily quotes – FE: { text, author }")
public class DailyQuoteController {

    private final DailyQuoteRepository quoteRepository;

    @GetMapping("/today")
    @Operation(summary = "Get today's quote by locale")
    public ResponseEntity<ApiResponse<DailyQuote>> today(@RequestParam(defaultValue = "en") String locale) {
        Optional<DailyQuote> q = quoteRepository.findFirstByLocaleAndActiveTrue(locale);
        return q.map(dq -> ResponseEntity.ok(ApiResponse.success(dq, "Quote retrieved")))
                .orElseGet(() -> ResponseEntity.ok(ApiResponse.success(null, "No quote found")));
    }

    /** FE extension: random quote (like zenquotes) – { text, author } */
    @GetMapping("/random")
    @Operation(summary = "Get random quote (FE: fallback when no daily)")
    public ResponseEntity<ApiResponse<DailyQuote>> random() {
        List<DailyQuote> all = quoteRepository.findByActiveTrue();
        if (all.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.success(null, "No quote found"));
        }
        DailyQuote q = all.get(new Random().nextInt(all.size()));
        return ResponseEntity.ok(ApiResponse.success(q, "Quote retrieved"));
    }
}
