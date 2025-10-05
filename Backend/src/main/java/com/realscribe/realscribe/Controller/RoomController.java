package com.realscribe.realscribe.Controller;


import com.realscribe.realscribe.DTO.RoomDto;
import com.realscribe.realscribe.Entity.Room;
import com.realscribe.realscribe.Repo.RoomRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
// /api/rooms
@RequestMapping("/api/room")
@CrossOrigin(origins = "*")
public class RoomController {
    private final RoomRepository roomRepo;

    public RoomController(RoomRepository roomRepo) {
        this.roomRepo = roomRepo;
    }

    //for creating the room
    @PostMapping
    public ResponseEntity<RoomDto> createRoom(@RequestBody RoomDto roomDto) {
        Room r = new Room();
        r.setDto(roomDto);
        roomRepo.save(r);
        //here we may add the user to the table room-presence
        return ResponseEntity.ok(roomDto);
    }

    //for joining the room
    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getRoom(@PathVariable String id) {
        return roomRepo.findById(id)
            .map(r -> ResponseEntity.ok(new RoomDto(r)))
            .orElse(ResponseEntity.notFound().build());
    }

    // check how many users are there if there is one, and he is leaving
    //then you may call this as to delete the room -> when there are no users there


//    @DeleteMapping("/{id}")
//    public ResponseEntity<?> deleteRoom(@PathVariable UUID id) {
//        roomRepo.deleteById(id);
//        return ResponseEntity.noContent().build();
//    }
}
