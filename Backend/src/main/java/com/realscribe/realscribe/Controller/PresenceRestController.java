package com.realscribe.realscribe.Controller;

import com.realscribe.realscribe.DTO.UserPresence;
import com.realscribe.realscribe.Service.PresenceService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "https://real-scribe.vercel.app")
@RequestMapping("/api")
public class PresenceRestController {

    private final PresenceService presenceService;

    public PresenceRestController(PresenceService presenceService) {
        this.presenceService = presenceService;
    }

    @GetMapping("/rooms/{roomId}/users")
    public List<UserPresence> getRoomUsers(@PathVariable String roomId) {
        return presenceService.list(roomId);
    }

    @GetMapping("/presence/debug")
    public String debugPresence() {
        presenceService.printState();
        return "Check console for presence state";
    }
}