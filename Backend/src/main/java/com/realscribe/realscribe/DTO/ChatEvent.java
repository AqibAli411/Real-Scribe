package com.realscribe.realscribe.DTO;

import java.util.List;

public record ChatEvent(
    String type, // "message_sent", "message_history", etc.
    String roomId,
    ChatMessage message,
    List<ChatMessage> messages
) {}