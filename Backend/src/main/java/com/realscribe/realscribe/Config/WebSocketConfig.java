package com.realscribe.realscribe.Config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.messaging.Message;
import org.springframework.context.annotation.Bean;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Arrays;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    private static final Logger logger = LoggerFactory.getLogger(WebSocketConfig.class);

    @Value("${ALLOWED_ORIGINS:https://real-scribe.vercel.app,http://localhost:5173,http://localhost:3000}")
    private String allowedOrigins;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        String[] origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toArray(String[]::new);

        registry.addEndpoint("/ws")
                .setAllowedOrigins(origins)
                .withSockJS();
    }

    @Bean
    public ChannelInterceptor presenceChannelInterceptor() {
        return new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                if (accessor != null) {
                    switch (accessor.getCommand()) {
                        case CONNECT:
                            // Extract user info from connect headers
                            String userId = accessor.getFirstNativeHeader("userId");
                            String name = accessor.getFirstNativeHeader("name");

                            if (userId != null && name != null) {
                                // Store in session attributes
                                accessor.getSessionAttributes().put("userId", userId);
                                accessor.getSessionAttributes().put("name", name);
                                logger.debug("User connected: {} ({})", name, userId);
                            } else {
                                logger.warn("Missing user credentials in connect headers");
                            }
                            break;

                        case DISCONNECT:
                            // Log disconnect
                            String disconnectingUserId = (String) accessor.getSessionAttributes().get("userId");
                            String disconnectingName = (String) accessor.getSessionAttributes().get("name");
                            logger.debug("User disconnecting: {} ({})", disconnectingName, disconnectingUserId);
                            break;
                    }
                }

                return message;
            }
        };
    }
}