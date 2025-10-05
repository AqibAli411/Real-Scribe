package com.realscribe.realscribe.Repo;

import com.realscribe.realscribe.Entity.TextOperation;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TextOperationRepository extends JpaRepository<TextOperation, Integer> {
    @Modifying
    @Transactional
    @Query("DELETE FROM TextOperation t WHERE t.roomId = :roomId")
    void deleteAllByRoomId(@Param("roomId") String roomId);

    Optional<TextOperation> findTopByRoomIdOrderByIdDesc(String roomId);
}
