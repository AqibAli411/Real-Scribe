package com.realscribe.realscribe.Repo;

import com.realscribe.realscribe.Entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, String> {
    Optional<Room> findByid(String id);
}