package com.realscribe.realscribe.Config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitingInterceptor implements HandlerInterceptor {
    private static final Logger logger = LoggerFactory.getLogger(RateLimitingInterceptor.class);
    private static final long WINDOW_SECONDS = 60;
    private static final int MAX_REQUESTS_PER_WINDOW = 120;

    private final Map<String, Counter> counters = new ConcurrentHashMap<>();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String client = clientKey(request);
        long now = Instant.now().getEpochSecond();
        Counter counter = counters.compute(client, (key, existing) -> {
            if (existing == null || now - existing.windowStartEpochSec >= WINDOW_SECONDS) {
                return new Counter(now, 1);
            }
            existing.count++;
            return existing;
        });

        if (counter.count > MAX_REQUESTS_PER_WINDOW) {
            logger.warn("rate_limit_hit client={} path={} method={}", client, request.getRequestURI(), request.getMethod());
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"rate_limit_exceeded\"}");
            return false;
        }
        return true;
    }

    private String clientKey(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private static final class Counter {
        private final long windowStartEpochSec;
        private int count;

        private Counter(long windowStartEpochSec, int count) {
            this.windowStartEpochSec = windowStartEpochSec;
            this.count = count;
        }
    }
}
