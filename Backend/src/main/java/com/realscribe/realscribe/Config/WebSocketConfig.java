package com.realscribe.realscribe.Config;

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

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
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
                                System.out.println("User connected: " + name + " (ID: " + userId + ")");
                            } else {
                                System.out.println("Warning: Missing user credentials in connect headers");
                            }
                            break;

                        case DISCONNECT:
                            // Log disconnect
                            String disconnectingUserId = (String) accessor.getSessionAttributes().get("userId");
                            String disconnectingName = (String) accessor.getSessionAttributes().get("name");
                            System.out.println("User disconnecting: " + disconnectingName + " (ID: " + disconnectingUserId + ")");
                            break;
                    }
                }

                return message;
            }
        };
    }
}