package com.example.employee_payroll_system.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import org.springframework.lang.NonNull;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    // Per-IP rate limit: 60 requests per minute
    private static final int REQUESTS_PER_MINUTE = 60;
    // Auth endpoints are stricter: 10 login attempts per minute
    private static final int AUTH_REQUESTS_PER_MINUTE = 10;

    private final ConcurrentHashMap<String, Bucket> ipBuckets = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Bucket> authBuckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {

        String clientIp = getClientIp(request);
        boolean isAuthEndpoint = request.getRequestURI().startsWith("/api/auth/");

        Bucket bucket = isAuthEndpoint
                ? authBuckets.computeIfAbsent(clientIp, k -> buildBucket(AUTH_REQUESTS_PER_MINUTE))
                : ipBuckets.computeIfAbsent(clientIp, k -> buildBucket(REQUESTS_PER_MINUTE));

        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
        } else {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Too many requests. Please slow down.\"}");
        }
    }

    private Bucket buildBucket(int requestsPerMinute) {
        Bandwidth limit = Bandwidth.builder()
                .capacity(requestsPerMinute)
                .refillGreedy(requestsPerMinute, Duration.ofMinutes(1))
                .build();
        return Bucket.builder().addLimit(limit).build();
    }

    private String getClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp;
        }
        return request.getRemoteAddr();
    }
}
