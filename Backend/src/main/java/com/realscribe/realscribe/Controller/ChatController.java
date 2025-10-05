package com.realscribe.realscribe.Controller;

import com.realscribe.realscribe.DTO.ChatEvent;
import com.realscribe.realscribe.DTO.ChatMessage;
import com.realscribe.realscribe.Service.ChatService;
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
@CrossOrigin(origins = "*")
public class ChatController {

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

            System.out.println("Received message - Session: " + sessionId + ", User: " + name + " (ID: " + userId + "), Content: " + content);

            if (userId == null) userId = sessionId;
            if (name == null) name = "Anonymous";
            if (content == null || content.trim().isEmpty()) {
                System.out.println("Ignoring empty message");
                return;
            }

            // Save message (this will return null if it's a duplicate)
            ChatMessage message = chatService.sendMessage(roomId, userId, name, content.trim());

            // Only broadcast if message was actually saved (not a duplicate)
            if (message != null) {
                System.out.println("Broadcasting message: " + message.id());
                broker.convertAndSend("/topic/room." + roomId + ".chat",
                        new ChatEvent("message_sent", roomId, message, null));
            } else {
                System.out.println("Message was duplicate, not broadcasting");
            }

        } catch (Exception e) {
            System.err.println("Error in sendMessage: " + e.getMessage());
            e.printStackTrace();
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
            System.err.println("Error getting room messages: " + e.getMessage());
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