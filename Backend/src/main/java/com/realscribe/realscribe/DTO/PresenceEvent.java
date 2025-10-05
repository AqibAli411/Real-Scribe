package com.realscribe.realscribe.DTO;

import java.util.List;

public record PresenceEvent(String type, String roomId, UserPresence user, List<UserPresence> users) {}