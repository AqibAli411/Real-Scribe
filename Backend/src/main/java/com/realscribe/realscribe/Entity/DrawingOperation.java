package com.realscribe.realscribe.Entity;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;

@Entity
@Data
@Table(name = "drawing_operations")
public class DrawingOperation {

    //this is definitely not user id -> STROKE_ID (String UUID)
    @Id
    private String id;

    @Column(name = "room_id", columnDefinition = "text")
    private String roomId;

    @Column(name = "operation_type")
    private String operationType;

    @Column(columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private JsonNode payload;  // Using JsonNode for proper JSON handling

}
