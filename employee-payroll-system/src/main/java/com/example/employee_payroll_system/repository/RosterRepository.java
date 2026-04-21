package com.example.employee_payroll_system.repository;

import com.example.employee_payroll_system.model.Employee;
import com.example.employee_payroll_system.model.Roster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RosterRepository extends JpaRepository<Roster, Long> {

    // Find rosters for an employee
    List<Roster> findByEmployeeOrderByShiftDateDescStartTimeAsc(Employee employee);

    // Find rosters created by a manager
    List<Roster> findByManagerOrderByShiftDateDesc(Employee manager);

    // Find rosters by date range
    List<Roster> findByShiftDateBetweenOrderByShiftDateAscStartTimeAsc(LocalDate startDate, LocalDate endDate);

    // Find rosters for a specific department
    List<Roster> findByDepartmentAndShiftDateBetweenOrderByShiftDateAsc(
            String department, LocalDate startDate, LocalDate endDate);

    // Find upcoming rosters for an employee
    @Query("SELECT r FROM Roster r WHERE r.employee.id = :employeeId AND r.shiftDate >= :today ORDER BY r.shiftDate ASC")
    List<Roster> findUpcomingRostersForEmployee(@Param("employeeId") Long employeeId, @Param("today") LocalDate today);

    // Get total scheduled hours for an employee in a date range
    @Query("SELECT SUM(r.totalShiftHours) FROM Roster r WHERE r.employee.id = :employeeId AND r.shiftDate BETWEEN :startDate AND :endDate")
    Double getTotalScheduledHoursForEmployee(@Param("employeeId") Long employeeId,
                                             @Param("startDate") LocalDate startDate,
                                             @Param("endDate") LocalDate endDate);

    // Find rosters by status
    List<Roster> findByStatus(Roster.RosterStatus status);

    // Check if employee has overlapping shifts
    @Query("SELECT COUNT(r) > 0 FROM Roster r WHERE r.employee.id = :employeeId AND " +
            "((r.startTime BETWEEN :startTime AND :endTime) OR (r.endTime BETWEEN :startTime AND :endTime) OR " +
            "(:startTime BETWEEN r.startTime AND r.endTime))")
    boolean hasOverlappingShift(@Param("employeeId") Long employeeId,
                                @Param("startTime") LocalDateTime startTime,
                                @Param("endTime") LocalDateTime endTime);
}