package com.example.employee_payroll_system.security;

import com.example.employee_payroll_system.model.AuditLog;
import com.example.employee_payroll_system.repository.AuditLogRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class AuditLoggingFilter extends OncePerRequestFilter {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        filterChain.doFilter(request, response);

        // Log after response is committed so we capture the status code
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = (auth != null && auth.isAuthenticated()
                    && !"anonymousUser".equals(auth.getPrincipal()))
                    ? auth.getName() : "anonymous";

            String clientIp = getClientIp(request);
            auditLogRepository.save(new AuditLog(
                    username,
                    request.getMethod(),
                    request.getRequestURI(),
                    clientIp,
                    response.getStatus()
            ));
        } catch (Exception ignored) {
            // Never let audit logging break the request pipeline
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
