package com.example.employee_payroll_system.controller;

import com.example.employee_payroll_system.model.Employee;
import com.example.employee_payroll_system.model.TimeEntry;
import com.example.employee_payroll_system.repository.EmployeeRepository;
import com.example.employee_payroll_system.repository.TimeEntryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/timesheets")
@CrossOrigin(origins = "*")
public class TimeEntryController {

    @Autowired
    private TimeEntryRepository timeEntryRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    // CLOCK IN
    @PostMapping("/clockin/{employeeId}")
    public ResponseEntity<?> clockIn(@PathVariable Long employeeId) {
        try {
            // Find employee
            Employee employee = employeeRepository.findById(employeeId)
                    .orElseThrow(() -> new RuntimeException("Employee not found with id: " + employeeId));

            // Check if already clocked in
            if (timeEntryRepository.findByEmployeeAndClockOutIsNull(employee).isPresent()) {
                return ResponseEntity.badRequest()
                        .body("Employee already clocked in. Please clock out first.");
            }

            // Create new time entry
            TimeEntry timeEntry = new TimeEntry();
            timeEntry.setEmployee(employee);
            timeEntry.setClockIn(LocalDateTime.now());

            TimeEntry savedEntry = timeEntryRepository.save(timeEntry);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Clocked in successfully");
            response.put("timeEntry", savedEntry);

            return new ResponseEntity<>(response, HttpStatus.CREATED);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Error clocking in: " + e.getMessage());
        }
    }

    // CLOCK OUT
    @PutMapping("/clockout/{employeeId}")
    public ResponseEntity<?> clockOut(@PathVariable Long employeeId,
                                      @RequestParam(required = false) Integer breakMinutes,
                                      @RequestParam(required = false) String notes) {
        try {
            // Find employee
            Employee employee = employeeRepository.findById(employeeId)
                    .orElseThrow(() -> new RuntimeException("Employee not found with id: " + employeeId));

            // Find active time entry
            TimeEntry timeEntry = timeEntryRepository.findByEmployeeAndClockOutIsNull(employee)
                    .orElseThrow(() -> new RuntimeException("No active clock-in found for employee"));

            // Update time entry
            timeEntry.setClockOut(LocalDateTime.now());
            timeEntry.setBreakMinutes(breakMinutes != null ? breakMinutes : 0);
            timeEntry.setNotes(notes);

            // Calculate total hours
            timeEntry.calculateTotalHours();

            TimeEntry savedEntry = timeEntryRepository.save(timeEntry);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Clocked out successfully");
            response.put("timeEntry", savedEntry);
            response.put("hoursWorked", savedEntry.getTotalHours());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Error clocking out: " + e.getMessage());
        }
    }

    // Get current shift status
    @GetMapping("/status/{employeeId}")
    public ResponseEntity<?> getCurrentShiftStatus(@PathVariable Long employeeId) {
        try {
            Employee employee = employeeRepository.findById(employeeId)
                    .orElseThrow(() -> new RuntimeException("Employee not found"));

            Optional<TimeEntry> activeShift = timeEntryRepository.findByEmployeeAndClockOutIsNull(employee);

            Map<String, Object> response = new HashMap<>();
            if (activeShift.isPresent()) {
                response.put("isClockedIn", true);
                response.put("clockInTime", activeShift.get().getClockIn());
                response.put("timeEntryId", activeShift.get().getId());
            } else {
                response.put("isClockedIn", false);
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Error checking status: " + e.getMessage());
        }
    }

    // Get time entries for an employee on a specific date
    @GetMapping("/employee/{employeeId}/date/{date}")
    public ResponseEntity<?> getTimeEntriesByDate(@PathVariable Long employeeId,
                                                  @PathVariable String date) {
        try {
            Employee employee = employeeRepository.findById(employeeId)
                    .orElseThrow(() -> new RuntimeException("Employee not found"));

            LocalDate localDate = LocalDate.parse(date);
            List<TimeEntry> entries = timeEntryRepository.findByEmployeeAndDate(employee, localDate);

            return ResponseEntity.ok(entries);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Error fetching time entries: " + e.getMessage());
        }
    }

    // Get time entries for an employee between dates
    @GetMapping("/employee/{employeeId}/range")
    public ResponseEntity<?> getTimeEntriesInRange(@PathVariable Long employeeId,
                                                   @RequestParam String startDate,
                                                   @RequestParam String endDate) {
        try {
            Employee employee = employeeRepository.findById(employeeId)
                    .orElseThrow(() -> new RuntimeException("Employee not found"));

            LocalDate start = LocalDate.parse(startDate);
            LocalDate end = LocalDate.parse(endDate);

            List<TimeEntry> entries = timeEntryRepository.findByEmployeeAndDateBetween(employee, start, end);

            // Calculate total hours
            Double totalHours = timeEntryRepository.getTotalHoursForEmployeeInPeriod(employeeId, start, end);

            Map<String, Object> response = new HashMap<>();
            response.put("entries", entries);
            response.put("totalHours", totalHours != null ? totalHours : 0);
            response.put("employeeName", employee.getFirstName() + " " + employee.getLastName());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Error fetching time entries: " + e.getMessage());
        }
    }

    // Get all time entries for an employee
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<?> getAllTimeEntriesForEmployee(@PathVariable Long employeeId) {
        try {
            Employee employee = employeeRepository.findById(employeeId)
                    .orElseThrow(() -> new RuntimeException("Employee not found"));

            List<TimeEntry> entries = timeEntryRepository.findByEmployee(employee);

            return ResponseEntity.ok(entries);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Error fetching time entries: " + e.getMessage());
        }
    }
}