package com.realscribe.realscribe.Repo;

import com.realscribe.realscribe.Entity.DrawingOperation;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;


public interface DrawingOperationRepository extends JpaRepository<DrawingOperation, String> {
    @Transactional
    void deleteById(String id); 

    @Transactional
    void deleteAllByIdIn(List<String> ids);  // For batch deletion

    List<DrawingOperation> findByRoomId(String roomId);

    @Transactional
    void deleteAllByRoomId(String roomId);
}
