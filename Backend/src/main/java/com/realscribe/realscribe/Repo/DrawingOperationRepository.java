package com.realscribe.realscribe.Repo;

import com.realscribe.realscribe.Entity.DrawingOperation;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;


public interface DrawingOperationRepository extends JpaRepository<DrawingOperation, Integer> {
    @Transactional
    void deleteById(int id);  // Keep as int

    @Transactional
    void deleteAllByIdIn(List<Integer> ids);  // For batch deletion
}
