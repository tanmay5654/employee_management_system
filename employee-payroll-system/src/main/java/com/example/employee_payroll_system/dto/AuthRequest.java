package com.example.employee_payroll_system.dto;

import lombok.Data;

@Data
public class AuthRequest {
    private String username;
    private String password;
}