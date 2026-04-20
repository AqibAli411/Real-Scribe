package com.realscribe.realscribe.DTO;

import com.realscribe.realscribe.Entity.Room;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RoomDto(
        @NotBlank(message = "Room id is required")
        @Pattern(regexp = "^[A-Z0-9]{6}$", message = "Room id must be 6 uppercase alphanumeric characters")
        String id,
        @Min(value = 0, message = "User id must be non-negative")
        int userId,
        @NotBlank(message = "Username is required")
        @Size(min = 2, max = 50, message = "Username must be between 2 and 50 characters")
        @Pattern(regexp = "^[\\p{L}\\p{N}_ .-]+$", message = "Username contains invalid characters")
        String username
) {
    public RoomDto(Room room) {
        this(room.getId(), room.getUserId(), room.getUsername());
    }
}
