package com.example.employee_payroll_system.controller;

import com.example.employee_payroll_system.model.Employee;
import com.example.employee_payroll_system.model.User;
import com.example.employee_payroll_system.repository.EmployeeRepository;
import com.example.employee_payroll_system.repository.UserRepository;
import com.example.employee_payroll_system.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/employees")
@CrossOrigin(origins = "*")
public class EmployeeController {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    // CREATE - Add a new employee
    @PostMapping
    public ResponseEntity<?> createEmployee(@RequestBody Employee employee) {
        try {
            // Check if employee code already exists
            if (employee.getEmployeeCode() != null &&
                    employeeRepository.findByEmployeeCode(employee.getEmployeeCode()).isPresent()) {
                return ResponseEntity.badRequest()
                        .body("Employee code already exists: " + employee.getEmployeeCode());
            }

            // Check if email already exists
            if (employee.getEmail() != null &&
                    employeeRepository.findByEmail(employee.getEmail()).isPresent()) {
                return ResponseEntity.badRequest()
                        .body("Email already exists: " + employee.getEmail());
            }

            // Save the employee
            Employee savedEmployee = employeeRepository.save(employee);

            // Auto-create a login account for the employee
            if (savedEmployee.getEmail() != null && !savedEmployee.getEmail().isBlank()
                    && !userRepository.existsByEmail(savedEmployee.getEmail())) {

                // Generate username from first + last name (lowercase, no spaces)
                String baseUsername = (savedEmployee.getFirstName() + "."
                        + savedEmployee.getLastName()).toLowerCase().replaceAll("\\s+", "");

                // Ensure username is unique
                String username = baseUsername;
                int suffix = 1;
                while (userRepository.existsByUsername(username)) {
                    username = baseUsername + suffix++;
                }

                // Generate a random 4-digit password
                String rawPassword = String.valueOf((int)(Math.random() * 9000) + 1000);

                // Create the user account
                User user = new User();
                user.setUsername(username);
                user.setEmail(savedEmployee.getEmail());
                user.setPassword(passwordEncoder.encode(rawPassword));
                user.setFullName(savedEmployee.getFirstName() + " " + savedEmployee.getLastName());
                user.setRole(savedEmployee.getRole() != null ? savedEmployee.getRole() : "EMPLOYEE");
                user.setEmployee(savedEmployee);
                userRepository.save(user);

                // Send credentials email to the employee
                emailService.sendEmployeeCredentials(
                        savedEmployee.getEmail(),
                        user.getFullName(),
                        username,
                        rawPassword
                );
            }

            return new ResponseEntity<>(savedEmployee, HttpStatus.CREATED);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to create employee: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    // READ - Get all active employees
    @GetMapping
    public ResponseEntity<List<Employee>> getAllEmployees() {
        List<Employee> employees = employeeRepository.findByIsActiveTrue();
        return ResponseEntity.ok(employees);
    }

    // READ - Get employee by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getEmployeeById(@PathVariable Long id) {
        return employeeRepository.findById(id)
                .map(employee -> ResponseEntity.ok(employee))
                .orElse(ResponseEntity.notFound().build());
    }

    // READ - Get employees by department
    @GetMapping("/department/{department}")
    public ResponseEntity<List<Employee>> getEmployeesByDepartment(@PathVariable String department) {
        List<Employee> employees = employeeRepository.findByDepartment(department);
        return ResponseEntity.ok(employees);
    }

    // UPDATE - Update an existing employee
    @PutMapping("/{id}")
    public ResponseEntity<?> updateEmployee(@PathVariable Long id, @RequestBody Employee employeeDetails) {
        try {
            return employeeRepository.findById(id)
                    .map(employee -> {
                        employee.setFirstName(employeeDetails.getFirstName());
                        employee.setLastName(employeeDetails.getLastName());
                        employee.setEmail(employeeDetails.getEmail());
                        employee.setPhone(employeeDetails.getPhone());
                        employee.setHourlyRate(employeeDetails.getHourlyRate());
                        employee.setDepartment(employeeDetails.getDepartment());
                        employee.setPosition(employeeDetails.getPosition());
                        Employee updatedEmployee = employeeRepository.save(employee);
                        return ResponseEntity.ok(updatedEmployee);
                    })
                    .orElse(ResponseEntity.notFound().build());

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to update employee: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    // DELETE - Soft delete (mark as inactive)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEmployee(@PathVariable Long id) {
        try {
            return employeeRepository.findById(id)
                    .map(employee -> {
                        employee.setIsActive(false);
                        employeeRepository.save(employee);
                        Map<String, String> response = new HashMap<>();
                        response.put("message", "Employee deleted successfully");
                        return ResponseEntity.ok(response);
                    })
                    .orElse(ResponseEntity.notFound().build());

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to delete employee: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    // GET - Get employee by employee code
    @GetMapping("/code/{employeeCode}")
    public ResponseEntity<?> getEmployeeByCode(@PathVariable String employeeCode) {
        return employeeRepository.findByEmployeeCode(employeeCode)
                .map(employee -> ResponseEntity.ok(employee))
                .orElse(ResponseEntity.notFound().build());
    }
}
