package com.realscribe.realscribe.WebSocketController;

import com.fasterxml.jackson.databind.ObjectMapper;

import com.realscribe.realscribe.DTO.WsMessage;
import com.realscribe.realscribe.Entity.DrawingOperation;
import com.realscribe.realscribe.Entity.TextOperation;
import com.realscribe.realscribe.Repo.DrawingOperationRepository;
import com.realscribe.realscribe.Repo.TextOperationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.*;

@Controller
public class WebSocketController {
    //this will be used to send the data
    private final SimpMessagingTemplate messaging;
    //this will be used to convert json <--> object
    private final ObjectMapper objectMapper;
//    //repo -> add to database
    private final DrawingOperationRepository opRepo;
//    private final RoomRepository roomRepo;
    private final TextOperationRepository textRepo;

    //to maintain live users logic
//    private final PresenceService presenceService;

    public WebSocketController(SimpMessagingTemplate messaging, ObjectMapper objectMapper,
                               DrawingOperationRepository opRepo, TextOperationRepository textRepo
//                               RoomRepository roomRepo,
//                               PresenceService presenceService
    ) {
        this.messaging = messaging;
        this.objectMapper = objectMapper;
        this.opRepo = opRepo;
        this.textRepo = textRepo;
//        this.roomRepo = roomRepo;
//        this.presenceService = presenceService;
    }

    // Example: clients publish to /app/room/{roomId}/msg
    @MessageMapping("/room/{roomId}/msg")
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
                // persist to DB
                DrawingOperation op = new DrawingOperation();
                op.setRoomId(roomId);
                op.setId(message.getStrokeId());
                op.setOperationType("stroke");
                op.setPayload(objectMapper.valueToTree(message.getPayload())); // Convert to JsonNode
                opRepo.save(op);
                // broadcast
                messaging.convertAndSend("/topic/room." + roomId, message);
                break;
            case "text_update":
                //delete all previous records
                textRepo.deleteAllByRoomId(roomId);
                //insert new one
                TextOperation textOperation = new TextOperation();
                textOperation.setRoomId(roomId);
                textOperation.setUserId(message.getUserId());
                textOperation.setPayload(objectMapper.valueToTree(message.getPayload())); // Convert to JsonNode
                textRepo.save(textOperation);

                messaging.convertAndSend("/topic/write/room." + roomId, message);
                break;
            case "clear":
                try {
                    Map<String, Object> payload = message.getPayload();
                    Object erasedStrokesObj = payload.get("erasedStrokes");

                    // Safely convert to List<Integer>
                    List<Integer> erasedStrokeIds = new ArrayList<>();
                    if (erasedStrokesObj instanceof List) {
                        for (Object id : (List<?>) erasedStrokesObj) {
                            try {
                                // Handle both String and Number input
                                int strokeId = id instanceof Number ? ((Number) id).intValue()
                                        : Integer.parseInt(id.toString());
                                erasedStrokeIds.add(strokeId);
                            } catch (NumberFormatException e) {
                                System.out.println("Invalid stroke ID format: {} "+ id);
                            }
                        }
                    }

                    // Batch delete in transaction
                    if (!erasedStrokeIds.isEmpty()) {
                        opRepo.deleteAllByIdIn(erasedStrokeIds);
                    }

                    messaging.convertAndSend("/topic/room." + roomId, message);
                } catch (Exception e) {
                    System.out.println("Error processing clear operation "+ e);
                }
                break;
            default:
                messaging.convertAndSend("/topic/room." + roomId, message);
        }
    }

    @MessageMapping("/room/{roomId}/join")
    public void Room(@DestinationVariable String roomId, @Payload WsMessage message,
                          @Header("simpSessionId") String sessionId) throws Exception{

    }

    // Handle subscribe events (presence)
    // Option A: override session connect/disconnect events with an ApplicationListener for
    // SessionConnectEvent or SessionDisconnectEvent
}
