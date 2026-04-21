package com.example.employee_payroll_system.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import java.time.LocalDate;

@Entity
@Table(name = "rosters")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Roster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "employee_id", nullable = false)
    @JsonIgnoreProperties({"timeEntries", "createdRosters", "assignedRosters"})
    private Employee employee;

    @ManyToOne
    @JoinColumn(name = "manager_id")
    private Employee manager; // The manager who created this roster

    @Column(name = "shift_date", nullable = false)
    private LocalDate shiftDate;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "break_duration")
    private Integer breakDuration; // in minutes

    @Column(name = "total_shift_hours")
    private Double totalShiftHours;

    @Column(name = "department")
    private String department;

    @Column(name = "shift_type")
    private String shiftType; // Morning, Evening, Night, etc.

    @Column(name = "notes")
    private String notes;

    @Column(name = "status")
    @Enumerated(EnumType.STRING)
    private RosterStatus status = RosterStatus.SCHEDULED;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        calculateShiftHours();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        calculateShiftHours();
    }

    private void calculateShiftHours() {
        if (startTime != null && endTime != null) {
            long minutes = java.time.Duration.between(startTime, endTime).toMinutes();
            double hours = minutes / 60.0;
            if (breakDuration != null) {
                hours -= (breakDuration / 60.0);
            }
            this.totalShiftHours = Math.max(0, hours);
        }
    }

    public enum RosterStatus {
        SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
    }
}