package com.realscribe.realscribe.Controller;

import com.realscribe.realscribe.DTO.PresenceEvent;
import com.realscribe.realscribe.DTO.UserPresence;
import com.realscribe.realscribe.DTO.ChatMessage;
import com.realscribe.realscribe.DTO.ChatEvent;
import com.realscribe.realscribe.Repo.DrawingOperationRepository;
import com.realscribe.realscribe.Repo.RoomRepository;
import com.realscribe.realscribe.Repo.TextOperationRepository;
import com.realscribe.realscribe.Service.PresenceService;
import com.realscribe.realscribe.Service.ChatService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.Map;

@Controller
public class EnhancedPresenceController {
    private static final Logger logger = LoggerFactory.getLogger(EnhancedPresenceController.class);

    private final PresenceService presence;
    private final ChatService chatService;
    private final SimpMessagingTemplate broker;
    private final RoomRepository roomRepository;
    private final DrawingOperationRepository drawingOperationRepository;
    private final TextOperationRepository textOperationRepository;

    public EnhancedPresenceController(
            PresenceService presence,
            ChatService chatService,
            SimpMessagingTemplate broker,
            RoomRepository roomRepository,
            DrawingOperationRepository drawingOperationRepository,
            TextOperationRepository textOperationRepository) {
        this.presence = presence;
        this.chatService = chatService;
        this.broker = broker;
        this.roomRepository = roomRepository;
        this.drawingOperationRepository = drawingOperationRepository;
        this.textOperationRepository = textOperationRepository;
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

            logger.debug("presence_join_request roomId={} userId={} sessionId={}", roomId, userId, sessionId);

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
                    logger.warn("presence_join_system_message_failed roomId={} error={}", roomId, e.toString());
                }
            }

            // Always broadcast presence update (but users list will be deduplicated by service)
            try {
                List<UserPresence> users = presence.list(roomId);
                broker.convertAndSend("/topic/room." + roomId + ".presence",
                        new PresenceEvent("presence_join", roomId,
                                new UserPresence(userId, name), users));
            } catch (Exception e) {
                logger.warn("presence_join_broadcast_failed roomId={} error={}", roomId, e.toString());
            }

        } catch (Exception e) {
            logger.error("presence_join_failed roomId={} error={}", roomId, e.toString());
        }
    }

    @MessageMapping("/room/{roomId}/presence.leave")
    public void leave(@DestinationVariable String roomId, @Payload Map<String, String> payload, StompHeaderAccessor sha) {
        try {
            String sessionId = sha.getSessionId();
            logger.debug("presence_leave_request roomId={} sessionId={}", roomId, sessionId);

            presence.leaveBySession(sessionId).ifPresent(binding -> {
                logger.info("presence_user_left roomId={} user={}", binding.roomId(), binding.name());

                // Create system message for user leaving
                try {
                    ChatMessage systemMessage = chatService.createSystemMessage(roomId, binding.name() + " left the collaboration");

                    // Only broadcast if system message was actually created (not duplicate)
                    if (systemMessage != null) {
                        broker.convertAndSend("/topic/room." + roomId + ".chat",
                                new ChatEvent("system_message", roomId, systemMessage, null));
                    }
                } catch (Exception e) {
                    logger.warn("presence_leave_system_message_failed roomId={} error={}", roomId, e.toString());
                }

                // Broadcast presence update
                try {
                    List<UserPresence> users = presence.list(roomId);
                    broker.convertAndSend("/topic/room." + roomId + ".presence",
                            new PresenceEvent("presence_leave", roomId,
                                    new UserPresence(binding.userId(), binding.name()), users));
                    
                    // Check if room is empty
                    if (users.isEmpty()) {
                        logger.info("presence_room_empty_cleanup_start roomId={}", roomId);
                        try {
                            // Delete all data associated with the room
                            drawingOperationRepository.deleteAllByRoomId(roomId);
                            textOperationRepository.deleteAllByRoomId(roomId);
                            chatService.clearRoomMessages(roomId);
                            roomRepository.deleteById(roomId);
                            logger.info("presence_room_cleanup_complete roomId={}", roomId);
                        } catch (Exception cleanupError) {
                            logger.error("presence_room_cleanup_failed roomId={} error={}", roomId, cleanupError.toString());
                        }
                    }
                    
                } catch (Exception e) {
                    logger.warn("presence_leave_broadcast_failed roomId={} error={}", roomId, e.toString());
                }
            });
        } catch (Exception e) {
            logger.error("presence_leave_failed roomId={} error={}", roomId, e.toString());
        }
    }
}