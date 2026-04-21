package com.example.employee_payroll_system.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Data
@NoArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "username")
    private String username;

    @Column(name = "method", length = 10)
    private String method;

    @Column(name = "endpoint", length = 512)
    private String endpoint;

    @Column(name = "client_ip", length = 64)
    private String clientIp;

    @Column(name = "status_code")
    private Integer statusCode;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    public AuditLog(String username, String method, String endpoint,
                    String clientIp, Integer statusCode) {
        this.username = username;
        this.method = method;
        this.endpoint = endpoint;
        this.clientIp = clientIp;
        this.statusCode = statusCode;
        this.timestamp = LocalDateTime.now();
    }
}
