package com.realscribe.realscribe.WebSocketController;

import com.fasterxml.jackson.databind.ObjectMapper;

import com.realscribe.realscribe.DTO.WsMessage;
import com.realscribe.realscribe.Entity.DrawingOperation;
import com.realscribe.realscribe.Entity.TextOperation;
import com.realscribe.realscribe.Repo.DrawingOperationRepository;
import com.realscribe.realscribe.Repo.TextOperationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import jakarta.annotation.PreDestroy;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Controller
public class WebSocketController {
    private static final Logger logger = LoggerFactory.getLogger(WebSocketController.class);

    //this will be used to send the data
    private final SimpMessagingTemplate messaging;
    //this will be used to convert json <--> object
    private final ObjectMapper objectMapper;
//    //repo -> add to database
    private final DrawingOperationRepository opRepo;
//    private final RoomRepository roomRepo;
    private final TextOperationRepository textRepo;
    private final Map<String, WsMessage> pendingTextPatches = new ConcurrentHashMap<>();
    private final ScheduledExecutorService textPatchBroadcaster = Executors.newSingleThreadScheduledExecutor();

    //to maintain live users logic
//    private final PresenceService presenceService;

    public WebSocketController(SimpMessagingTemplate messaging, ObjectMapper objectMapper,
                               DrawingOperationRepository opRepo, TextOperationRepository textRepo
    ) {
        this.messaging = messaging;
        this.objectMapper = objectMapper;
        this.opRepo = opRepo;
        this.textRepo = textRepo;

        // Coalesce bursty patch traffic: keep latest patch per room and broadcast at fixed cadence.
        textPatchBroadcaster.scheduleAtFixedRate(() -> {
            for (Map.Entry<String, WsMessage> entry : pendingTextPatches.entrySet()) {
                if (pendingTextPatches.remove(entry.getKey(), entry.getValue())) {
                    messaging.convertAndSend("/topic/write/room." + entry.getKey(), entry.getValue());
                }
            }
        }, 40, 40, TimeUnit.MILLISECONDS);
    }

    @PreDestroy
    public void shutdownBroadcaster() {
        textPatchBroadcaster.shutdownNow();
    }

    // Example: clients publish to /app/room/{roomId}/msg
    @MessageMapping("/room/{roomId}/msg")
    @Transactional
    public void onMessage(@DestinationVariable String roomId, @Payload WsMessage message,
                          @Header("simpSessionId") String sessionId) throws Exception {

        // Basic routing
        switch (message.getType()) {
            //when cursor moves
            case "stroke_move":
                // broadcast to others
                messaging.convertAndSend("/topic/room." + roomId, message);
                break;
            case "stroke_end":
                try {
                    // persist to DB
                    DrawingOperation op = new DrawingOperation();
                    op.setRoomId(roomId);
                    op.setId(message.getStrokeId());
                    op.setOperationType("stroke");
                    op.setPayload(objectMapper.valueToTree(message.getPayload())); // Convert to JsonNode
                    
                    opRepo.save(op);
                    
                    // broadcast
                    messaging.convertAndSend("/topic/room." + roomId, message);
                } catch (Exception e) {
                    logger.error("Failed to save stroke_end for room {} and stroke {}", roomId, message.getStrokeId(), e);
                    // Still broadcast to keep clients in sync even if DB fails? 
                    // Better to fail visibly? For now, let's try to broadcast anyway so users can draw
                    messaging.convertAndSend("/topic/room." + roomId, message);
                }
                break;
            case "text_update":
                // Update latest row in-place when possible (reduces write amplification and table churn).
                TextOperation textOperation = textRepo.findTopByRoomIdOrderByIdDesc(roomId)
                        .orElseGet(TextOperation::new);
                textOperation.setRoomId(roomId);
                textOperation.setUserId(message.getUserId());
                textOperation.setPayload(objectMapper.valueToTree(message.getPayload())); // Convert to JsonNode
                textRepo.save(textOperation);

                messaging.convertAndSend("/topic/write/room." + roomId, message);
                break;
            case "text_patch":
                pendingTextPatches.put(roomId, message);
                break;
            case "clear":
                try {
                    Map<String, Object> payload = message.getPayload();
                    Object erasedStrokesObj = payload.get("erasedStrokes");

                    // Safely convert to List<String>
                    List<String> erasedStrokeIds = new ArrayList<>();
                    if (erasedStrokesObj instanceof List) {
                        for (Object id : (List<?>) erasedStrokesObj) {
                            if (id != null) {
                                erasedStrokeIds.add(id.toString());
                            }
                        }
                    }

                    // Batch delete in transaction
                    if (!erasedStrokeIds.isEmpty()) {
                        opRepo.deleteAllByIdIn(erasedStrokeIds);
                    }

                    messaging.convertAndSend("/topic/room." + roomId, message);
                } catch (Exception e) {
                    logger.error("Error processing clear operation for room {}", roomId, e);
                }
                break;
            default:
                messaging.convertAndSend("/topic/room." + roomId, message);
        }
    }

}
