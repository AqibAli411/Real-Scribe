package com.realscribe.realscribe.Config;

import com.realscribe.realscribe.DTO.PresenceEvent;
import com.realscribe.realscribe.DTO.UserPresence;
import com.realscribe.realscribe.DTO.ChatMessage;
import com.realscribe.realscribe.DTO.ChatEvent;
import com.realscribe.realscribe.Service.PresenceService;
import com.realscribe.realscribe.Service.ChatService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.List;

@Component
public class PresenceEvents {
    private static final Logger logger = LoggerFactory.getLogger(PresenceEvents.class);

    private final PresenceService presence;
    private final ChatService chatService;
    private final SimpMessagingTemplate broker;

    public PresenceEvents(PresenceService presence, ChatService chatService, SimpMessagingTemplate broker) {
        this.presence = presence;
        this.chatService = chatService;
        this.broker = broker;
    }

    @EventListener
    public void onDisconnect(SessionDisconnectEvent event) {
        try {
            StompHeaderAccessor sha = StompHeaderAccessor.wrap(event.getMessage());
            String sessionId = sha.getSessionId();
            String userId = (String) sha.getSessionAttributes().get("userId");
            String name = (String) sha.getSessionAttributes().get("name");

            logger.debug("presence_disconnect_event sessionId={} userId={}", sessionId, userId);

            presence.leaveBySession(sessionId).ifPresent(binding -> {
                logger.info("presence_user_left roomId={} user={}", binding.roomId(), binding.name());

                // Create system message for user leaving
                try {
                    ChatMessage systemMessage = chatService.createSystemMessage(
                            binding.roomId(),
                            binding.name() + " left the collaboration"
                    );

                    // Broadcast system message to chat
                    broker.convertAndSend("/topic/room." + binding.roomId() + ".chat",
                            new ChatEvent("system_message", binding.roomId(), systemMessage, null));
                } catch (Exception e) {
                    logger.warn("presence_leave_system_message_failed roomId={} error={}", binding.roomId(), e.toString());
                }

                // Broadcast presence leave event
                try {
                    List<UserPresence> users = presence.list(binding.roomId());
                    broker.convertAndSend("/topic/room." + binding.roomId() + ".presence",
                            new PresenceEvent("presence_leave", binding.roomId(),
                                    new UserPresence(binding.userId(), binding.name()), users));
                } catch (Exception e) {
                    logger.warn("presence_leave_broadcast_failed roomId={} error={}", binding.roomId(), e.toString());
                }
            });
        } catch (Exception e) {
            logger.error("presence_disconnect_handler_failed error={}", e.toString());
        }
    }
}