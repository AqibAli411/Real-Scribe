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
    ) {
        this.messaging = messaging;
        this.objectMapper = objectMapper;
        this.opRepo = opRepo;
        this.textRepo = textRepo;
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
                try {
                    System.out.println("Processing stroke_end for room: " + roomId + ", strokeId: " + message.getStrokeId());
                    // persist to DB
                    DrawingOperation op = new DrawingOperation();
                    op.setRoomId(roomId);
                    op.setId(message.getStrokeId());
                    op.setOperationType("stroke");
                    op.setPayload(objectMapper.valueToTree(message.getPayload())); // Convert to JsonNode
                    
                    System.out.println("Saving operation to DB...");
                    opRepo.save(op);
                    System.out.println("Successfully saved operation: " + op.getId());
                    
                    // broadcast
                    messaging.convertAndSend("/topic/room." + roomId, message);
                } catch (Exception e) {
                    System.err.println("FAILED to save stroke_end: " + e.getMessage());
                    e.printStackTrace();
                    // Still broadcast to keep clients in sync even if DB fails? 
                    // Better to fail visibly? For now, let's try to broadcast anyway so users can draw
                    messaging.convertAndSend("/topic/room." + roomId, message);
                }
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


}
