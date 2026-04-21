package com.example.employee_payroll_system.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "employees")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_code", unique = true, nullable = false)
    private String employeeCode;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(name = "email", unique = true)
    private String email;

    @Column(name = "phone")
    private String phone;

    @Column(name = "hourly_rate", nullable = false)
    private Double hourlyRate;

    @Column(name = "department")
    private String department;

    @Column(name = "position")
    private String position;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @JsonIgnore
    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL)
    private List<TimeEntry> timeEntries;

    // Add these fields to track roles
    @Column(name = "role")
    private String role = "EMPLOYEE"; // "MANAGER" or "EMPLOYEE"

    @Column(name = "managed_department")
    private String managedDepartment; // If manager, which department they manage

    // Add these relationships
    @OneToMany(mappedBy = "employee")
    private List<Roster> assignedRosters;

    @OneToMany(mappedBy = "manager")
    private List<Roster> createdRosters;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}