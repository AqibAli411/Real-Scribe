package com.realscribe.realscribe.DTO;

import com.realscribe.realscribe.Entity.Room;

public record RoomDto(String id, int userId, String username) {
    public RoomDto(Room room) {
        this(room.getId(), room.getUserId(), room.getUsername());
    }
}
