package com.example.employee_payroll_system.controller;

import com.example.employee_payroll_system.model.Employee;
import com.example.employee_payroll_system.repository.EmployeeRepository;
import com.example.employee_payroll_system.repository.TimeEntryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "*")
public class AnalyticsController {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private TimeEntryRepository timeEntryRepository;

    /**
     * GET /api/analytics/weekly-hours
     * Returns total hours worked per employee for the current week.
     */
    @GetMapping("/weekly-hours")
    public ResponseEntity<List<Map<String, Object>>> getWeeklyHours() {
        LocalDate weekStart = LocalDate.now().with(DayOfWeek.MONDAY);
        LocalDate weekEnd = weekStart.plusDays(6);

        List<Employee> employees = employeeRepository.findByIsActiveTrue();
        List<Map<String, Object>> data = new ArrayList<>();

        for (Employee emp : employees) {
            Double hours = timeEntryRepository.getTotalHoursForEmployeeInPeriod(
                    emp.getId(), weekStart, weekEnd);
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("name", emp.getFirstName() + " " + emp.getLastName());
            row.put("department", emp.getDepartment());
            row.put("hours", hours != null ? Math.round(hours * 10.0) / 10.0 : 0);
            data.add(row);
        }

        data.sort((a, b) -> Double.compare((Double) b.get("hours"), (Double) a.get("hours")));
        return ResponseEntity.ok(data);
    }

    /**
     * GET /api/analytics/overtime-trends
     * Returns weekly overtime totals for the past 8 weeks.
     * Overtime = hours > 40 in a week per employee.
     */
    @GetMapping("/overtime-trends")
    public ResponseEntity<List<Map<String, Object>>> getOvertimeTrends() {
        List<Map<String, Object>> trends = new ArrayList<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM dd");

        for (int i = 7; i >= 0; i--) {
            LocalDate weekStart = LocalDate.now().with(DayOfWeek.MONDAY).minusWeeks(i);
            LocalDate weekEnd = weekStart.plusDays(6);

            List<Employee> employees = employeeRepository.findByIsActiveTrue();
            double totalOvertime = 0;
            int overtimeEmployees = 0;

            for (Employee emp : employees) {
                Double hours = timeEntryRepository.getTotalHoursForEmployeeInPeriod(
                        emp.getId(), weekStart, weekEnd);
                if (hours != null && hours > 40) {
                    totalOvertime += hours - 40;
                    overtimeEmployees++;
                }
            }

            Map<String, Object> week = new LinkedHashMap<>();
            week.put("week", weekStart.format(fmt));
            week.put("overtimeHours", Math.round(totalOvertime * 10.0) / 10.0);
            week.put("employeesWithOvertime", overtimeEmployees);
            trends.add(week);
        }

        return ResponseEntity.ok(trends);
    }

    /**
     * GET /api/analytics/department-summary
     * Returns employee count and average hourly rate per department.
     */
    @GetMapping("/department-summary")
    public ResponseEntity<List<Map<String, Object>>> getDepartmentSummary() {
        List<Employee> employees = employeeRepository.findByIsActiveTrue();
        Map<String, List<Employee>> byDept = new LinkedHashMap<>();

        for (Employee emp : employees) {
            String dept = emp.getDepartment() != null ? emp.getDepartment() : "Unassigned";
            byDept.computeIfAbsent(dept, k -> new ArrayList<>()).add(emp);
        }

        List<Map<String, Object>> summary = new ArrayList<>();
        for (Map.Entry<String, List<Employee>> entry : byDept.entrySet()) {
            double avgRate = entry.getValue().stream()
                    .mapToDouble(e -> e.getHourlyRate() != null ? e.getHourlyRate() : 0)
                    .average().orElse(0);

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("department", entry.getKey());
            row.put("employeeCount", entry.getValue().size());
            row.put("avgHourlyRate", Math.round(avgRate * 100.0) / 100.0);
            summary.add(row);
        }

        summary.sort((a, b) -> Integer.compare((Integer) b.get("employeeCount"), (Integer) a.get("employeeCount")));
        return ResponseEntity.ok(summary);
    }

    /**
     * GET /api/analytics/payroll-forecast
     * Returns estimated weekly payroll cost per department for the current week
     * based on hours worked × hourly rate.
     */
    @GetMapping("/payroll-forecast")
    public ResponseEntity<List<Map<String, Object>>> getPayrollForecast() {
        LocalDate weekStart = LocalDate.now().with(DayOfWeek.MONDAY);
        LocalDate weekEnd = weekStart.plusDays(6);

        List<Employee> employees = employeeRepository.findByIsActiveTrue();
        Map<String, Double> deptCost = new LinkedHashMap<>();

        for (Employee emp : employees) {
            String dept = emp.getDepartment() != null ? emp.getDepartment() : "Unassigned";
            Double hours = timeEntryRepository.getTotalHoursForEmployeeInPeriod(
                    emp.getId(), weekStart, weekEnd);
            double cost = (hours != null ? hours : 0) * (emp.getHourlyRate() != null ? emp.getHourlyRate() : 0);
            deptCost.merge(dept, cost, (a, b) -> a + b);
        }

        List<Map<String, Object>> forecast = new ArrayList<>();
        for (Map.Entry<String, Double> entry : deptCost.entrySet()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("department", entry.getKey());
            row.put("estimatedCost", Math.round(entry.getValue() * 100.0) / 100.0);
            forecast.add(row);
        }

        forecast.sort((a, b) -> Double.compare((Double) b.get("estimatedCost"), (Double) a.get("estimatedCost")));
        return ResponseEntity.ok(forecast);
    }
}
