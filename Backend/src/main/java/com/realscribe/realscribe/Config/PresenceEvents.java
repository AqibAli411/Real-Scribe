package com.realscribe.realscribe.Config;

import com.realscribe.realscribe.DTO.PresenceEvent;
import com.realscribe.realscribe.DTO.UserPresence;
import com.realscribe.realscribe.DTO.ChatMessage;
import com.realscribe.realscribe.DTO.ChatEvent;
import com.realscribe.realscribe.Service.PresenceService;
import com.realscribe.realscribe.Service.ChatService;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.List;

@Component
public class PresenceEvents {

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

            System.out.println("Session disconnecting: " + sessionId + " for user: " + name + " (ID: " + userId + ")");

            presence.leaveBySession(sessionId).ifPresent(binding -> {
                System.out.println("User truly left room: " + binding.name() + " from room: " + binding.roomId());

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
                    System.err.println("Error creating system message for user leave: " + e.getMessage());
                }

                // Broadcast presence leave event
                try {
                    List<UserPresence> users = presence.list(binding.roomId());
                    broker.convertAndSend("/topic/room." + binding.roomId() + ".presence",
                            new PresenceEvent("presence_leave", binding.roomId(),
                                    new UserPresence(binding.userId(), binding.name()), users));
                } catch (Exception e) {
                    System.err.println("Error broadcasting presence leave: " + e.getMessage());
                }
            });
        } catch (Exception e) {
            System.err.println("Error handling disconnect event: " + e.getMessage());
            e.printStackTrace();
        }
    }
}