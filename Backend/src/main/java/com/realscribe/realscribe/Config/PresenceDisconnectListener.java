package com.realscribe.realscribe.Config;

import com.realscribe.realscribe.DTO.ChatEvent;
import com.realscribe.realscribe.DTO.ChatMessage;
import com.realscribe.realscribe.DTO.PresenceEvent;
import com.realscribe.realscribe.DTO.UserPresence;
import com.realscribe.realscribe.Repo.DrawingOperationRepository;
import com.realscribe.realscribe.Repo.RoomRepository;
import com.realscribe.realscribe.Repo.TextOperationRepository;
import com.realscribe.realscribe.Service.ChatService;
import com.realscribe.realscribe.Service.PresenceService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.List;

@Component
public class PresenceDisconnectListener {
    private static final Logger logger = LoggerFactory.getLogger(PresenceDisconnectListener.class);

    private final PresenceService presence;
    private final ChatService chatService;
    private final SimpMessagingTemplate broker;
    private final RoomRepository roomRepository;
    private final DrawingOperationRepository drawingOperationRepository;
    private final TextOperationRepository textOperationRepository;

    public PresenceDisconnectListener(
            PresenceService presence,
            ChatService chatService,
            SimpMessagingTemplate broker,
            RoomRepository roomRepository,
            DrawingOperationRepository drawingOperationRepository,
            TextOperationRepository textOperationRepository
    ) {
        this.presence = presence;
        this.chatService = chatService;
        this.broker = broker;
        this.roomRepository = roomRepository;
        this.drawingOperationRepository = drawingOperationRepository;
        this.textOperationRepository = textOperationRepository;
    }

    @EventListener
    public void onDisconnect(SessionDisconnectEvent event) {
        String sessionId = event.getSessionId();
        if (sessionId == null) {
            return;
        }

        presence.leaveBySession(sessionId).ifPresent(binding -> {
            String roomId = binding.roomId();

            try {
                ChatMessage systemMessage = chatService.createSystemMessage(
                        roomId,
                        binding.name() + " left the collaboration"
                );

                if (systemMessage != null) {
                    broker.convertAndSend(
                            "/topic/room." + roomId + ".chat",
                            new ChatEvent("system_message", roomId, systemMessage, null)
                    );
                }
            } catch (Exception e) {
                logger.error("Error creating leave system message for room {}", roomId, e);
            }

            try {
                List<UserPresence> users = presence.list(roomId);
                broker.convertAndSend(
                        "/topic/room." + roomId + ".presence",
                        new PresenceEvent(
                                "presence_leave",
                                roomId,
                                new UserPresence(binding.userId(), binding.name()),
                                users
                        )
                );

                if (users.isEmpty()) {
                    drawingOperationRepository.deleteAllByRoomId(roomId);
                    textOperationRepository.deleteAllByRoomId(roomId);
                    chatService.clearRoomMessages(roomId);
                    roomRepository.deleteById(roomId);
                    logger.info("Room {} and associated data deleted after last disconnect", roomId);
                }
            } catch (Exception e) {
                logger.error("Error broadcasting leave/cleanup for room {}", roomId, e);
            }
        });
    }
}
