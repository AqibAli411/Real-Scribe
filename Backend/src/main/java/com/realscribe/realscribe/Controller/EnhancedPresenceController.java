package com.realscribe.realscribe.Controller;

import com.realscribe.realscribe.DTO.PresenceEvent;
import com.realscribe.realscribe.DTO.UserPresence;
import com.realscribe.realscribe.DTO.ChatMessage;
import com.realscribe.realscribe.DTO.ChatEvent;
import com.realscribe.realscribe.Service.PresenceService;
import com.realscribe.realscribe.Service.ChatService;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.util.List;
import java.util.Map;

@Controller
@CrossOrigin(origins = "*")
public class EnhancedPresenceController {

    private final PresenceService presence;
    private final ChatService chatService;
    private final SimpMessagingTemplate broker;

    public EnhancedPresenceController(PresenceService presence, ChatService chatService, SimpMessagingTemplate broker) {
        this.presence = presence;
        this.chatService = chatService;
        this.broker = broker;
    }

    @MessageMapping("/room/{roomId}/presence.join")
    public void join(@DestinationVariable String roomId, @Payload Map<String, String> payload, StompHeaderAccessor sha) {
        try {
            String sessionId = sha.getSessionId();

            // Get user info from payload first, then fallback to session attributes
            String userId = payload.get("userId");
            String name = payload.get("name");

            if (userId == null) {
                userId = (String) sha.getSessionAttributes().get("userId");
            }
            if (name == null) {
                name = (String) sha.getSessionAttributes().get("name");
            }

            // Final fallbacks
            if (userId == null) userId = sessionId;
            if (name == null) name = "Anonymous";

            System.out.println("Join request - Room: " + roomId + ", User: " + name + " (ID: " + userId + "), Session: " + sessionId);

            // Update session attributes with the final values
            sha.getSessionAttributes().put("userId", userId);
            sha.getSessionAttributes().put("name", name);
            sha.getSessionAttributes().put("roomId", roomId);

            boolean firstSession = presence.join(roomId, userId, name, sessionId);

            // Only create system message if this is truly a new user joining
            if (firstSession) {
                try {
                    ChatMessage systemMessage = chatService.createSystemMessage(roomId, name + " joined the collaboration");

                    // Only broadcast if system message was actually created (not duplicate)
                    if (systemMessage != null) {
                        broker.convertAndSend("/topic/room." + roomId + ".chat",
                                new ChatEvent("system_message", roomId, systemMessage, null));
                    }
                } catch (Exception e) {
                    System.err.println("Error creating join system message: " + e.getMessage());
                }
            }

            // Always broadcast presence update (but users list will be deduplicated by service)
            try {
                List<UserPresence> users = presence.list(roomId);
                broker.convertAndSend("/topic/room." + roomId + ".presence",
                        new PresenceEvent("presence_join", roomId,
                                new UserPresence(userId, name), users));
            } catch (Exception e) {
                System.err.println("Error broadcasting presence join: " + e.getMessage());
            }

        } catch (Exception e) {
            System.err.println("Error in join method: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @MessageMapping("/room/{roomId}/presence.leave")
    public void leave(@DestinationVariable String roomId, @Payload Map<String, String> payload, StompHeaderAccessor sha) {
        try {
            String sessionId = sha.getSessionId();
            System.out.println("Leave request - Room: " + roomId + ", Session: " + sessionId);

            presence.leaveBySession(sessionId).ifPresent(binding -> {
                System.out.println("User truly left room: " + binding.name() + " from room: " + binding.roomId());

                // Create system message for user leaving
                try {
                    ChatMessage systemMessage = chatService.createSystemMessage(roomId, binding.name() + " left the collaboration");

                    // Only broadcast if system message was actually created (not duplicate)
                    if (systemMessage != null) {
                        broker.convertAndSend("/topic/room." + roomId + ".chat",
                                new ChatEvent("system_message", roomId, systemMessage, null));
                    }
                } catch (Exception e) {
                    System.err.println("Error creating leave system message: " + e.getMessage());
                }

                // Broadcast presence update
                try {
                    List<UserPresence> users = presence.list(roomId);
                    broker.convertAndSend("/topic/room." + roomId + ".presence",
                            new PresenceEvent("presence_leave", roomId,
                                    new UserPresence(binding.userId(), binding.name()), users));
                } catch (Exception e) {
                    System.err.println("Error broadcasting presence leave: " + e.getMessage());
                }
            });
        } catch (Exception e) {
            System.err.println("Error in leave method: " + e.getMessage());
            e.printStackTrace();
        }
    }
}