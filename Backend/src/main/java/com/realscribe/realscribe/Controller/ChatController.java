package com.realscribe.realscribe.Controller;

import com.realscribe.realscribe.DTO.ChatEvent;
import com.realscribe.realscribe.DTO.ChatMessage;
import com.realscribe.realscribe.Service.ChatService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Controller
public class ChatController {
    private static final Logger logger = LoggerFactory.getLogger(ChatController.class);

    private final ChatService chatService;
    private final SimpMessagingTemplate broker;

    public ChatController(ChatService chatService, SimpMessagingTemplate broker) {
        this.chatService = chatService;
        this.broker = broker;
    }

    // Client sends message to /app/room/{roomId}/chat.send
    @MessageMapping("/room/{roomId}/chat.send")
    public void sendMessage(
            @DestinationVariable String roomId,
            @Payload Map<String, String> payload,
            StompHeaderAccessor sha) {

        try {
            String sessionId = sha.getSessionId();
            String userId = (String) sha.getSessionAttributes().get("userId");
            String name = (String) sha.getSessionAttributes().get("name");
            String content = payload.get("content");

            if (userId == null) userId = sessionId;
            if (name == null) name = "Anonymous";
            if (content == null || content.trim().isEmpty()) {
                logger.debug("chat_empty_message_ignored roomId={} sessionId={}", roomId, sessionId);
                return;
            }

            // Save message (this will return null if it's a duplicate)
            ChatMessage message = chatService.sendMessage(roomId, userId, name, content.trim());

            // Only broadcast if message was actually saved (not a duplicate)
            if (message != null) {
                logger.debug("chat_message_broadcast roomId={} messageId={}", roomId, message.id());
                broker.convertAndSend("/topic/room." + roomId + ".chat",
                        new ChatEvent("message_sent", roomId, message, null));
            }

        } catch (Exception e) {
            logger.error("chat_send_failed roomId={} error={}", roomId, e.toString());
        }
    }

    // REST endpoint for getting chat history
    @GetMapping("/api/rooms/{roomId}/messages")
    @ResponseBody
    public List<ChatMessage> getRoomMessages(
            @PathVariable String roomId,
            @RequestParam(defaultValue = "50") int limit) {

        try {
            return chatService.getRoomMessages(roomId, limit);
        } catch (Exception e) {
            logger.error("chat_history_fetch_failed roomId={} error={}", roomId, e.toString());
            return new ArrayList<>();
        }
    }

    // Debug endpoint to check message count
    @GetMapping("/api/rooms/{roomId}/messages/count")
    @ResponseBody
    public Map<String, Object> getMessageCount(@PathVariable String roomId) {
        return Map.of(
                "roomId", roomId,
                "messageCount", chatService.getMessageCount(roomId)
        );
    }
}