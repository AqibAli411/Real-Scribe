package com.realscribe.realscribe.Service;

import com.realscribe.realscribe.DTO.ChatMessage;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class ChatService {

    // roomId -> List of messages (in memory for now, use DB in production)
    private final Map<String, List<ChatMessage>> roomMessages = new ConcurrentHashMap<>();
    private final Map<String, AtomicLong> messageCounters = new ConcurrentHashMap<>();
    private final AtomicLong globalCounter = new AtomicLong(0);

    public synchronized ChatMessage sendMessage(String roomId, String userId, String senderName, String content) {
        String messageId = generateMessageId(roomId);

        ChatMessage message = new ChatMessage(
                messageId,
                roomId,
                userId,
                senderName,
                content,
                ChatMessage.MessageType.MESSAGE,
                LocalDateTime.now()
        );

        List<ChatMessage> messages = roomMessages.computeIfAbsent(roomId, k -> Collections.synchronizedList(new ArrayList<>()));

        // Check for duplicate messages (same content from same user within 1 second)
        boolean isDuplicate = messages.stream()
                .filter(m -> m.userId().equals(userId))
                .filter(m -> m.content().equals(content))
                .anyMatch(m -> Math.abs(java.time.Duration.between(m.timestamp(), message.timestamp()).toMillis()) < 1000);

        if (!isDuplicate) {
            messages.add(message);
            System.out.println("Message added: " + messageId + " from user: " + senderName);
            return message;
        } else {
            System.out.println("Duplicate message detected and ignored: " + content + " from user: " + senderName);
            return null; // Return null for duplicates
        }
    }

    public synchronized ChatMessage createSystemMessage(String roomId, String content) {
        String messageId = generateMessageId(roomId);

        ChatMessage systemMessage = new ChatMessage(
                messageId,
                roomId,
                "system",
                "System",
                content,
                ChatMessage.MessageType.SYSTEM,
                LocalDateTime.now()
        );

        List<ChatMessage> messages = roomMessages.computeIfAbsent(roomId, k -> Collections.synchronizedList(new ArrayList<>()));

        // Check for duplicate system messages
        boolean isDuplicate = messages.stream()
                .filter(m -> m.type() == ChatMessage.MessageType.SYSTEM)
                .filter(m -> m.content().equals(content))
                .anyMatch(m -> Math.abs(java.time.Duration.between(m.timestamp(), systemMessage.timestamp()).toMillis()) < 5000);

        if (!isDuplicate) {
            messages.add(systemMessage);
            System.out.println("System message added: " + messageId + " - " + content);
            return systemMessage;
        } else {
            System.out.println("Duplicate system message detected and ignored: " + content);
            return null;
        }
    }

    public List<ChatMessage> getRoomMessages(String roomId, int limit) {
        List<ChatMessage> messages = roomMessages.getOrDefault(roomId, new ArrayList<>());
        synchronized (messages) {
            int fromIndex = Math.max(0, messages.size() - limit);
            return new ArrayList<>(messages.subList(fromIndex, messages.size()));
        }
    }

    public List<ChatMessage> getRoomMessages(String roomId) {
        List<ChatMessage> messages = roomMessages.getOrDefault(roomId, new ArrayList<>());
        synchronized (messages) {
            return new ArrayList<>(messages);
        }
    }

    private String generateMessageId(String roomId) {
        // Use both room-specific counter and global counter for uniqueness
        AtomicLong roomCounter = messageCounters.computeIfAbsent(roomId, k -> new AtomicLong(0));
        long roomCount = roomCounter.incrementAndGet();
        long globalCount = globalCounter.incrementAndGet();

        return roomId + "_msg_" + roomCount + "_" + globalCount + "_" + System.nanoTime();
    }

    // Method to get message count for a room
    public int getMessageCount(String roomId) {
        return roomMessages.getOrDefault(roomId, new ArrayList<>()).size();
    }

    // Method to clear old messages (useful for memory management)
    public synchronized void clearOldMessages(String roomId, int keepLastN) {
        List<ChatMessage> messages = roomMessages.get(roomId);
        if (messages != null && messages.size() > keepLastN) {
            synchronized (messages) {
                int removeCount = messages.size() - keepLastN;
                for (int i = 0; i < removeCount; i++) {
                    messages.remove(0);
                }
                System.out.println("Cleared " + removeCount + " old messages from room: " + roomId);
            }
        }
    }
}