package com.realscribe.realscribe.DTO;

import java.time.LocalDateTime;

public record ChatMessage(
    String id,
    String roomId,
    String userId,
    String senderName,
    String content,
    MessageType type,
    LocalDateTime timestamp
) {
    public enum MessageType {
        MESSAGE, SYSTEM, AI_RESPONSE
    }
}