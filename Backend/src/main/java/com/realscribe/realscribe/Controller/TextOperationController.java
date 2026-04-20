package com.realscribe.realscribe.Controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.realscribe.realscribe.Entity.TextOperation;
import com.realscribe.realscribe.Repo.TextOperationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/text")
public class TextOperationController {
    private static final Logger logger = LoggerFactory.getLogger(TextOperationController.class);

    private final TextOperationRepository repo;

    public TextOperationController(TextOperationRepository repo) {
        this.repo = repo;
    }

    @GetMapping("/latest/{roomId}")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getLatestDocument(@PathVariable String roomId) {
        try {
            return repo.findTopByRoomIdOrderByIdDesc(roomId)
                    .map(doc -> Map.of(
                            "exists", true,
                            "content", doc.getPayload() != null ? doc.getPayload() : Map.of()
                    ))
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.ok(
                            Map.of(
                                    "exists", false,
                                    "content", Map.of()
                            )
                    ));
        } catch (Exception e) {
            logger.error("text_latest_fetch_failed roomId={} error={}", roomId, e.toString());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "exists", false,
                            "content", Map.of(),
                            "error", e.getMessage()
                    ));
        }
    }


}
