package com.realscribe.realscribe.Service;

import com.realscribe.realscribe.DTO.UserPresence;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Scheduled;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PresenceService {
    private static final Logger logger = LoggerFactory.getLogger(PresenceService.class);

    // roomId -> userId -> set of sessionIds
    private final Map<String, Map<String, Set<String>>> roomUsers = new ConcurrentHashMap<>();
    // sessionId -> (roomId, userId, name)
    private final Map<String, UserBinding> sessions = new ConcurrentHashMap<>();

    public record UserBinding(String roomId, String userId, String name) {}

    public synchronized boolean join(String roomId, String userId, String name, String sessionId) {
        if (roomId == null || userId == null || name == null || sessionId == null) {
            logger.warn("presence_join_invalid_input roomId={} userId={} sessionId={}", roomId, userId, sessionId);
            return false;
        }

        // Remove any existing session binding for this sessionId to prevent duplicates
        UserBinding existingBinding = sessions.remove(sessionId);
        if (existingBinding != null) {
            // Clean up the old binding
            cleanupSessionFromRoom(existingBinding.roomId, existingBinding.userId, sessionId);
        }

        // Create new binding
        sessions.put(sessionId, new UserBinding(roomId, userId, name));

        // Add to room users
        Set<String> userSessions = roomUsers.computeIfAbsent(roomId, r -> new ConcurrentHashMap<>())
                .computeIfAbsent(userId, u -> ConcurrentHashMap.newKeySet());

        boolean isFirstSession = userSessions.isEmpty();
        userSessions.add(sessionId);
        return isFirstSession;
    }

    public synchronized Optional<UserBinding> leaveBySession(String sessionId) {
        if (sessionId == null) {
            logger.warn("presence_leave_invalid_input sessionId=null");
            return Optional.empty();
        }

        UserBinding binding = sessions.remove(sessionId);
        if (binding == null) {
            logger.debug("presence_leave_session_not_found sessionId={}", sessionId);
            return Optional.empty();
        }

        boolean userFullyLeft = cleanupSessionFromRoom(binding.roomId, binding.userId, sessionId);

        return userFullyLeft ? Optional.of(binding) : Optional.empty();
    }

    private boolean cleanupSessionFromRoom(String roomId, String userId, String sessionId) {
        Map<String, Set<String>> users = roomUsers.get(roomId);
        if (users == null) return true;

        Set<String> sessionsForUser = users.get(userId);
        if (sessionsForUser != null) {
            sessionsForUser.remove(sessionId);

            if (sessionsForUser.isEmpty()) {
                users.remove(userId);

                if (users.isEmpty()) {
                    roomUsers.remove(roomId);
                    logger.info("presence_room_empty roomId={}", roomId);
                }
                return true; // User fully left
            }
        }
        return false; // User still has other sessions
    }

    public List<UserPresence> list(String roomId) {
        if (roomId == null) return new ArrayList<>();

        Map<String, Set<String>> users = roomUsers.getOrDefault(roomId, Map.of());
        List<UserPresence> list = new ArrayList<>();

        users.forEach((userId, sessionSet) -> {
            if (!sessionSet.isEmpty()) { // Only include users with active sessions
                // Find name from any active session
                String name = sessions.values().stream()
                        .filter(b -> b.roomId.equals(roomId) && b.userId.equals(userId))
                        .map(UserBinding::name)
                        .findFirst().orElse(userId);
                list.add(new UserPresence(userId, name));
            }
        });

        list.sort(Comparator.comparing(UserPresence::name));
        return list;
    }

    // Cleanup orphaned sessions periodically
    @Scheduled(fixedRate = 300000) // Every 5 minutes
    public synchronized void cleanupOrphanedSessions() {
        Set<String> orphanedSessions = new HashSet<>();

        // Find sessions that exist in sessions map but not in roomUsers
        sessions.forEach((sessionId, binding) -> {
            Map<String, Set<String>> users = roomUsers.get(binding.roomId);
            if (users == null ||
                    !users.containsKey(binding.userId) ||
                    !users.get(binding.userId).contains(sessionId)) {
                orphanedSessions.add(sessionId);
            }
        });

        // Remove orphaned sessions
        orphanedSessions.forEach(sessionId -> {
            UserBinding removed = sessions.remove(sessionId);
            if (removed != null) {
                logger.debug("presence_orphaned_session_cleaned sessionId={} user={}", sessionId, removed.name);
            }
        });

        if (!orphanedSessions.isEmpty()) {
            logger.info("presence_orphaned_sessions_cleaned count={}", orphanedSessions.size());
        }
    }

    // Debug method to print current state
    public synchronized void printState() {
        logger.debug("presence_state sessions={} rooms={}", sessions.size(), roomUsers.size());
    }
}