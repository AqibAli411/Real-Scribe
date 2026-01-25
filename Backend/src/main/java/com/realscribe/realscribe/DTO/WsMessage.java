package com.realscribe.realscribe.DTO;

import lombok.Data;

import java.util.Map;

@Data
public class WsMessage {
    private String type; // e.g., stroke_move, stroke_end, text_update, clear, join, leave, create
    private String roomId;
    private String name;
    private String strokeId;
    private String userId;
    
    //payload is the data in the case of Stroke -> (Strokes object),
    private Map<String, Object> payload;
    // getters/setters

}
