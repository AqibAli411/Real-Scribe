package com.realscribe.realscribe.Entity;

import com.realscribe.realscribe.DTO.RoomDto;
import jakarta.persistence.*;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Data
@Table(name="rooms")
public class Room {
    @Id
    @Column(columnDefinition = "text")
    private String id;

    @Column(name = "user_id")
    private int userId;

    private String username;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        createdAt = OffsetDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    public void setDto(RoomDto roomDto){
        this.userId = roomDto.userId();
        this.username = roomDto.username();
        this.id = roomDto.id();
    }

}
