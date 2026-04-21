package com.example.employee_payroll_system.repository;

import com.example.employee_payroll_system.model.Employee;
import com.example.employee_payroll_system.model.TimeEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TimeEntryRepository extends JpaRepository<TimeEntry, Long> {

    // Find all time entries for an employee
    List<TimeEntry> findByEmployee(Employee employee);

    // Find active clock-in (where clock_out is null)
    Optional<TimeEntry> findByEmployeeAndClockOutIsNull(Employee employee);

    // Find time entries for an employee on a specific date
    List<TimeEntry> findByEmployeeAndDate(Employee employee, LocalDate date);

    // Find time entries between dates
    List<TimeEntry> findByEmployeeAndDateBetween(Employee employee, LocalDate start, LocalDate end);

    // Find time entries by date range
    List<TimeEntry> findByClockInBetween(LocalDateTime start, LocalDateTime end);

    // Get total hours worked by an employee in a date range
    @Query("SELECT SUM(t.totalHours) FROM TimeEntry t WHERE t.employee.id = :employeeId AND t.date BETWEEN :startDate AND :endDate")
    Double getTotalHoursForEmployeeInPeriod(@Param("employeeId") Long employeeId,
                                            @Param("startDate") LocalDate startDate,
                                            @Param("endDate") LocalDate endDate);

}