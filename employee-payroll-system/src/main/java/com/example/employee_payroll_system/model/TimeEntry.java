package com.example.employee_payroll_system.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.Duration;

@Entity
@Table(name = "time_entries")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TimeEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "employee_id", nullable = false)
    @JsonIgnoreProperties({"timeEntries", "createdRosters", "assignedRosters"})
    private Employee employee;

    @Column(name = "clock_in", nullable = false)
    private LocalDateTime clockIn;

    @Column(name = "clock_out")
    private LocalDateTime clockOut;

    @Column(name = "break_minutes")
    private Integer breakMinutes = 0;

    @Column(name = "total_hours")
    private Double totalHours;

    @Column(name = "date")
    private LocalDate date;

    @Column(name = "notes")
    private String notes;

    @PrePersist
    protected void onCreate() {
        if (date == null) {
            date = LocalDate.now();
        }
    }

    // Method to calculate total hours
    public void calculateTotalHours() {
        if (clockIn != null && clockOut != null) {
            Duration duration = Duration.between(clockIn, clockOut);
            double hours = duration.toMinutes() / 60.0;
            this.totalHours = Math.max(0, hours - (breakMinutes / 60.0));
        }
    }
}