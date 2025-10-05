package com.realscribe.realscribe.Service;

import com.realscribe.realscribe.DTO.UserPresence;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Scheduled;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PresenceService {

    // roomId -> userId -> set of sessionIds
    private final Map<String, Map<String, Set<String>>> roomUsers = new ConcurrentHashMap<>();
    // sessionId -> (roomId, userId, name)
    private final Map<String, UserBinding> sessions = new ConcurrentHashMap<>();

    public record UserBinding(String roomId, String userId, String name) {}

    public synchronized boolean join(String roomId, String userId, String name, String sessionId) {
        if (roomId == null || userId == null || name == null || sessionId == null) {
            System.err.println("Cannot join: null parameters - roomId: " + roomId + ", userId: " + userId + ", name: " + name + ", sessionId: " + sessionId);
            return false;
        }

        System.out.println("Joining room - Room: " + roomId + ", User: " + name + " (ID: " + userId + "), Session: " + sessionId);

        // Remove any existing session binding for this sessionId to prevent duplicates
        UserBinding existingBinding = sessions.remove(sessionId);
        if (existingBinding != null) {
            System.out.println("Removed existing session binding for session: " + sessionId);
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

        System.out.println("User " + name + " now has " + userSessions.size() + " sessions in room " + roomId);
        return isFirstSession;
    }

    public synchronized Optional<UserBinding> leaveBySession(String sessionId) {
        if (sessionId == null) {
            System.err.println("Cannot leave: sessionId is null");
            return Optional.empty();
        }

        UserBinding binding = sessions.remove(sessionId);
        if (binding == null) {
            System.out.println("No binding found for session: " + sessionId);
            return Optional.empty();
        }

        System.out.println("Leaving session - Room: " + binding.roomId + ", User: " + binding.name + " (ID: " + binding.userId + "), Session: " + sessionId);

        boolean userFullyLeft = cleanupSessionFromRoom(binding.roomId, binding.userId, sessionId);

        return userFullyLeft ? Optional.of(binding) : Optional.empty();
    }

    private boolean cleanupSessionFromRoom(String roomId, String userId, String sessionId) {
        Map<String, Set<String>> users = roomUsers.get(roomId);
        if (users == null) return true;

        Set<String> sessionsForUser = users.get(userId);
        if (sessionsForUser != null) {
            sessionsForUser.remove(sessionId);
            System.out.println("User " + userId + " now has " + sessionsForUser.size() + " sessions in room " + roomId);

            if (sessionsForUser.isEmpty()) {
                users.remove(userId);
                System.out.println("User " + userId + " fully left room " + roomId);

                if (users.isEmpty()) {
                    roomUsers.remove(roomId);
                    System.out.println("Room " + roomId + " is now empty");
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
        System.out.println("Running orphaned session cleanup...");

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
                System.out.println("Cleaned up orphaned session: " + sessionId + " for user: " + removed.name);
            }
        });

        if (!orphanedSessions.isEmpty()) {
            System.out.println("Cleaned up " + orphanedSessions.size() + " orphaned sessions");
        }
    }

    // Debug method to print current state
    public synchronized void printState() {
        System.out.println("=== Presence Service State ===");
        System.out.println("Sessions: " + sessions.size());
        sessions.forEach((sessionId, binding) ->
                System.out.println("  " + sessionId + " -> " + binding));

        System.out.println("Room Users: " + roomUsers.size());
        roomUsers.forEach((roomId, users) -> {
            System.out.println("  Room " + roomId + ":");
            users.forEach((userId, sessions) ->
                    System.out.println("    User " + userId + " -> " + sessions));
        });
        System.out.println("==============================");
    }
}