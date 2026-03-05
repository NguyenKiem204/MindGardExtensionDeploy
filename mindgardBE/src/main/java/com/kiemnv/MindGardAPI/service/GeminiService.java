package com.kiemnv.MindGardAPI.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;

@Service
@Slf4j
public class GeminiService {

    @Value("${gemini.api-key:}")
    private String apiKey;

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String GEMINI_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

    /**
     * Generate summary + tags for a note's content.
     * Returns a Map with "summary" and "tags" keys.
     */
    public Map<String, String> enhanceNote(String title, String content) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("Gemini API key not configured");
            return Map.of("summary", "", "tags", "");
        }

        String prompt = """
                Analyze this note and return a JSON object with exactly two fields:
                1. "summary": a concise 1-sentence summary in the same language as the note
                2. "tags": comma-separated relevant tags (max 5 tags, lowercase)
                
                Note title: %s
                Note content: %s
                
                Return ONLY valid JSON, no markdown, no explanation.
                Example: {"summary": "...", "tags": "react, frontend, study"}
                """.formatted(
                title != null ? title : "",
                content != null ? content : ""
        );

        try {
            String requestBody = objectMapper.writeValueAsString(Map.of(
                    "contents", new Object[]{
                            Map.of("parts", new Object[]{
                                    Map.of("text", prompt)
                            })
                    }
            ));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(GEMINI_URL + "?key=" + apiKey))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("Gemini API error: {} - {}", response.statusCode(), response.body());
                return Map.of("summary", "", "tags", "");
            }

            JsonNode root = objectMapper.readTree(response.body());
            String text = root.at("/candidates/0/content/parts/0/text").asText("");

            // Clean markdown code block wrapper if present
            text = text.replaceAll("```json\\s*", "").replaceAll("```\\s*", "").trim();

            JsonNode result = objectMapper.readTree(text);
            String summary = result.has("summary") ? result.get("summary").asText("") : "";
            String tags = result.has("tags") ? result.get("tags").asText("") : "";

            return Map.of("summary", summary, "tags", tags);

        } catch (Exception e) {
            log.error("Failed to call Gemini API: {}", e.getMessage());
            return Map.of("summary", "", "tags", "");
        }
    }

    /**
     * Analyze study sessions.
     * Returns a Map with "performanceScore" (0-100), "peakTime" (string), "feedback" (string).
     */
    public Map<String, Object> reviewStudySessions(String sessionsData) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("Gemini API key not configured");
            return Map.of("performanceScore", 0, "peakTime", "--", "feedback", "Please set API key.");
        }

        String prompt = """
                You are a productivity AI coach analyzing a user's study/focus sessions.
                Below is the JSON data representing recent study sessions. Analyze this data and return a JSON object with exactly three fields:
                1. "performanceScore": an integer from 0 to 100 scoring their study efficiency and consistency
                2. "peakTime": a string identifying their most productive time of day (e.g. "8:00 AM - 11:00 AM" or "Not enough data")
                3. "feedback": a concise, 1-2 sentence motivating remark or advice in Vietnamese.
                
                Sessions: %s
                
                Return ONLY valid JSON, no markdown formatting.
                """.formatted(sessionsData);

        try {
            String requestBody = objectMapper.writeValueAsString(Map.of(
                    "contents", new Object[]{
                            Map.of("parts", new Object[]{
                                    Map.of("text", prompt)
                            })
                    }
            ));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(GEMINI_URL + "?key=" + apiKey))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("Gemini API error: {} - {}", response.statusCode(), response.body());
                return Map.of("performanceScore", 0, "peakTime", "Error", "feedback", "Lỗi phân tích.");
            }

            JsonNode root = objectMapper.readTree(response.body());
            String text = root.at("/candidates/0/content/parts/0/text").asText("");

            text = text.replaceAll("```json\\s*", "").replaceAll("```\\s*", "").trim();

            JsonNode result = objectMapper.readTree(text);
            int performanceScore = result.has("performanceScore") ? result.get("performanceScore").asInt(0) : 0;
            String peakTime = result.has("peakTime") ? result.get("peakTime").asText("--") : "--";
            String feedback = result.has("feedback") ? result.get("feedback").asText("") : "";

            return Map.of(
                "performanceScore", performanceScore,
                "peakTime", peakTime,
                "feedback", feedback
            );

        } catch (Exception e) {
            log.error("Failed to call Gemini API for sessions: {}", e.getMessage());
            return Map.of("performanceScore", 0, "peakTime", "Error", "feedback", "Lỗi kết nối AI.");
        }
    }
}
