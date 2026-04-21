package com.example.employee_payroll_system.repository;

import com.example.employee_payroll_system.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    // Find employee by unique employee code
    Optional<Employee> findByEmployeeCode(String employeeCode);

    // Find employee by unique email
    Optional<Employee> findByEmail(String email);

    // Find all employees in a specific department
    List<Employee> findByDepartment(String department);

    // Find all active employees (not deleted)
    List<Employee> findByIsActiveTrue();

    // Find all employees by position
    List<Employee> findByPosition(String position);
}