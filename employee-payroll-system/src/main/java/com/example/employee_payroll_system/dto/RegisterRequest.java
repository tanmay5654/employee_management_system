package com.example.employee_payroll_system.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String username;
    private String email;
    private String password;
    private String fullName;
    private String role = "EMPLOYEE";
    private Long employeeId; // Optional: link to existing employee
}