package com.realscribe.realscribe.Controller;

import com.realscribe.realscribe.Entity.DrawingOperation;
import com.realscribe.realscribe.Repo.DrawingOperationRepository;
import com.realscribe.realscribe.Repo.RoomRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
// /api/rooms
@RequestMapping("/api/draw")
@CrossOrigin(origins = "*")
public class DrawingOperationController {
    private final DrawingOperationRepository drawingOperationRepository;

    public DrawingOperationController(DrawingOperationRepository drawingOperationRepository) {
        this.drawingOperationRepository = drawingOperationRepository;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<DrawingOperation> getDrawingOperations() {
        return drawingOperationRepository.findAll();
    }


}
