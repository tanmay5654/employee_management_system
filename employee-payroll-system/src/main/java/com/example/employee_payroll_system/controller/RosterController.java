package com.example.employee_payroll_system.controller;

import com.example.employee_payroll_system.model.Employee;
import com.example.employee_payroll_system.model.Roster;
import com.example.employee_payroll_system.repository.EmployeeRepository;
import com.example.employee_payroll_system.repository.RosterRepository;
import com.example.employee_payroll_system.repository.TimeEntryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/rosters")
@CrossOrigin(origins = "http://localhost:3000")
public class RosterController {

    @Autowired
    private RosterRepository rosterRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private TimeEntryRepository timeEntryRepository;

    // MANAGER: Create a new roster shift
    @PostMapping("/create")
    public ResponseEntity<?> createRoster(@RequestBody RosterRequest request) {
        try {
            // Verify manager exists and has manager role
            Employee manager = employeeRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new RuntimeException("Manager not found"));

            if (!"MANAGER".equals(manager.getRole())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Only managers can create rosters");
            }

            // Verify employee exists
            Employee employee = employeeRepository.findById(request.getEmployeeId())
                    .orElseThrow(() -> new RuntimeException("Employee not found"));

            // Check for overlapping shifts
            if (rosterRepository.hasOverlappingShift(
                    employee.getId(),
                    request.getStartTime(),
                    request.getEndTime())) {
                return ResponseEntity.badRequest()
                        .body("Employee already has a shift during this time");
            }

            // Create roster
            Roster roster = new Roster();
            roster.setEmployee(employee);
            roster.setManager(manager);
            roster.setShiftDate(request.getShiftDate());
            roster.setStartTime(request.getStartTime());
            roster.setEndTime(request.getEndTime());
            roster.setBreakDuration(request.getBreakDuration());
            roster.setDepartment(request.getDepartment());
            roster.setShiftType(request.getShiftType());
            roster.setNotes(request.getNotes());
            roster.setStatus(Roster.RosterStatus.SCHEDULED);

            Roster savedRoster = rosterRepository.save(roster);

            return new ResponseEntity<>(savedRoster, HttpStatus.CREATED);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Error creating roster: " + e.getMessage());
        }
    }

    // MANAGER: Update roster
    @PutMapping("/update/{rosterId}")
    public ResponseEntity<?> updateRoster(@PathVariable Long rosterId,
                                          @RequestBody RosterRequest request,
                                          @RequestParam Long managerId) {
        try {
            Employee manager = employeeRepository.findById(managerId)
                    .orElseThrow(() -> new RuntimeException("Manager not found"));

            if (!"MANAGER".equals(manager.getRole())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            Roster roster = rosterRepository.findById(rosterId)
                    .orElseThrow(() -> new RuntimeException("Roster not found"));

            // Update fields
            roster.setStartTime(request.getStartTime());
            roster.setEndTime(request.getEndTime());
            roster.setBreakDuration(request.getBreakDuration());
            roster.setShiftType(request.getShiftType());
            roster.setNotes(request.getNotes());
            roster.setStatus(request.getStatus());

            Roster updatedRoster = rosterRepository.save(roster);

            return ResponseEntity.ok(updatedRoster);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Error updating roster: " + e.getMessage());
        }
    }

    // EMPLOYEE: View their own rosters
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<?> getEmployeeRosters(@PathVariable Long employeeId) {
        try {
            Employee employee = employeeRepository.findById(employeeId)
                    .orElseThrow(() -> new RuntimeException("Employee not found"));

            List<Roster> rosters = rosterRepository.findByEmployeeOrderByShiftDateDescStartTimeAsc(employee);

            // Calculate total hours for each roster
            Map<String, Object> response = new HashMap<>();
            response.put("rosters", rosters);

            // Get total scheduled hours for current month
            LocalDate now = LocalDate.now();
            LocalDate monthStart = now.withDayOfMonth(1);
            LocalDate monthEnd = now.withDayOfMonth(now.lengthOfMonth());

            Double totalMonthHours = rosterRepository.getTotalScheduledHoursForEmployee(
                    employeeId, monthStart, monthEnd);

            response.put("totalScheduledHoursThisMonth", totalMonthHours != null ? totalMonthHours : 0);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Error fetching rosters: " + e.getMessage());
        }
    }

    // EMPLOYEE: View upcoming shifts
    @GetMapping("/employee/{employeeId}/upcoming")
    public ResponseEntity<?> getUpcomingShifts(@PathVariable Long employeeId) {
        try {
            List<Roster> upcomingRosters = rosterRepository.findUpcomingRostersForEmployee(
                    employeeId, LocalDate.now());

            return ResponseEntity.ok(upcomingRosters);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Error fetching upcoming shifts: " + e.getMessage());
        }
    }

    // MANAGER: View all rosters (with filters)
    @GetMapping("/all")
    public ResponseEntity<?> getAllRosters(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) Long managerId) {

        try {
            // Verify manager
            if (managerId != null) {
                Employee manager = employeeRepository.findById(managerId)
                        .orElseThrow(() -> new RuntimeException("Manager not found"));
                if (!"MANAGER".equals(manager.getRole())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
                }
            }

            List<Roster> rosters;

            if (startDate != null && endDate != null) {
                if (department != null && !department.isEmpty()) {
                    rosters = rosterRepository.findByDepartmentAndShiftDateBetweenOrderByShiftDateAsc(
                            department, startDate, endDate);
                } else {
                    rosters = rosterRepository.findByShiftDateBetweenOrderByShiftDateAscStartTimeAsc(
                            startDate, endDate);
                }
            } else {
                // Default to current week
                LocalDate today = LocalDate.now();
                LocalDate weekStart = today.minusDays(today.getDayOfWeek().getValue() - 1);
                LocalDate weekEnd = weekStart.plusDays(6);
                rosters = rosterRepository.findByShiftDateBetweenOrderByShiftDateAscStartTimeAsc(
                        weekStart, weekEnd);
            }

            // Group by employee for summary
            Map<String, Object> response = new HashMap<>();
            response.put("rosters", rosters);

            // Department summary
            Map<String, Long> departmentSummary = rosters.stream()
                    .collect(Collectors.groupingBy(Roster::getDepartment, Collectors.counting()));
            response.put("departmentSummary", departmentSummary);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Error fetching rosters: " + e.getMessage());
        }
    }

    // EMPLOYEE: Get combined view of scheduled vs actual hours
    @GetMapping("/employee/{employeeId}/hours-summary")
    public ResponseEntity<?> getHoursSummary(
            @PathVariable Long employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        try {
            // Get scheduled hours from rosters
            Double scheduledHours = rosterRepository.getTotalScheduledHoursForEmployee(
                    employeeId, startDate, endDate);

            // Get actual worked hours from time entries
            Double actualHours = timeEntryRepository.getTotalHoursForEmployeeInPeriod(
                    employeeId, startDate, endDate);

            Map<String, Object> summary = new HashMap<>();
            summary.put("employeeId", employeeId);
            summary.put("startDate", startDate);
            summary.put("endDate", endDate);
            summary.put("scheduledHours", scheduledHours != null ? scheduledHours : 0);
            summary.put("actualHours", actualHours != null ? actualHours : 0);
            summary.put("difference", (actualHours != null ? actualHours : 0) -
                    (scheduledHours != null ? scheduledHours : 0));

            return ResponseEntity.ok(summary);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Error fetching hours summary: " + e.getMessage());
        }
    }

    // DTO for roster requests
    static class RosterRequest {
        private Long employeeId;
        private Long managerId;
        private LocalDate shiftDate;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private Integer breakDuration;
        private String department;
        private String shiftType;
        private String notes;
        private Roster.RosterStatus status;

        // Getters and setters
        public Long getEmployeeId() { return employeeId; }
        public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

        public Long getManagerId() { return managerId; }
        public void setManagerId(Long managerId) { this.managerId = managerId; }

        public LocalDate getShiftDate() { return shiftDate; }
        public void setShiftDate(LocalDate shiftDate) { this.shiftDate = shiftDate; }

        public LocalDateTime getStartTime() { return startTime; }
        public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

        public LocalDateTime getEndTime() { return endTime; }
        public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

        public Integer getBreakDuration() { return breakDuration; }
        public void setBreakDuration(Integer breakDuration) { this.breakDuration = breakDuration; }

        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }

        public String getShiftType() { return shiftType; }
        public void setShiftType(String shiftType) { this.shiftType = shiftType; }

        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }

        public Roster.RosterStatus getStatus() { return status; }
        public void setStatus(Roster.RosterStatus status) { this.status = status; }
    }
}