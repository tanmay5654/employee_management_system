package com.example.employee_payroll_system.controller;

import com.example.employee_payroll_system.dto.AuthRequest;
import com.example.employee_payroll_system.dto.AuthResponse;
import com.example.employee_payroll_system.dto.RegisterRequest;
import com.example.employee_payroll_system.model.Employee;
import com.example.employee_payroll_system.model.User;
import com.example.employee_payroll_system.repository.EmployeeRepository;
import com.example.employee_payroll_system.repository.UserRepository;
import com.example.employee_payroll_system.security.JwtUtil;
import com.example.employee_payroll_system.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    @Autowired
    private EmployeeRepository employeeRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest authRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(authRequest.getUsername(), authRequest.getPassword())
            );

            if (authentication.isAuthenticated()) {
                User user = userRepository.findByUsername(authRequest.getUsername())
                        .orElseThrow(() -> new UsernameNotFoundException("User not found"));

                String token = jwtUtil.generateToken(authRequest.getUsername(), user.getRole());

                return ResponseEntity.ok(new AuthResponse(
                        token,
                        user.getUsername(),
                        user.getRole(),
                        user.getId(),
                        "Login successful"
                ));
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid credentials"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid username or password"));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest registerRequest) {
        try {
            if (userRepository.existsByUsername(registerRequest.getUsername())) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Username already exists"));
            }

            if (registerRequest.getEmail() != null && userRepository.existsByEmail(registerRequest.getEmail())) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Email already exists"));
            }

            // Auto-generate 4-digit password
            String rawPassword = String.valueOf((int)(Math.random() * 9000) + 1000);

            String role = registerRequest.getRole() != null ? registerRequest.getRole() : "EMPLOYEE";

            // Split fullName into first / last name
            String fullName = registerRequest.getFullName() != null ? registerRequest.getFullName().trim() : registerRequest.getUsername();
            String[] nameParts = fullName.split("\\s+", 2);
            String firstName = nameParts[0];
            String lastName  = nameParts.length > 1 ? nameParts[1] : "";

            // Create Employee record so this person appears in the employee list
            Employee employee = new Employee();
            employee.setFirstName(firstName);
            employee.setLastName(lastName);
            employee.setEmail(registerRequest.getEmail());
            employee.setRole(role);
            employee.setIsActive(true);
            employee.setHourlyRate(0.0);
            employee.setEmployeeCode("EMP-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
            Employee savedEmployee = employeeRepository.save(employee);

            // Create login account linked to the employee record
            User user = new User();
            user.setUsername(registerRequest.getUsername());
            user.setEmail(registerRequest.getEmail());
            user.setPassword(passwordEncoder.encode(rawPassword));
            user.setFullName(fullName);
            user.setRole(role);
            user.setEmployee(savedEmployee);

            User savedUser = userRepository.save(user);

            // Send credentials to the registered email
            if (registerRequest.getEmail() != null && !registerRequest.getEmail().isBlank()) {
                emailService.sendEmployeeCredentials(
                        savedUser.getEmail(),
                        fullName,
                        savedUser.getUsername(),
                        rawPassword
                );
            }

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of(
                            "message", "Account created! Your username and password have been sent to your email.",
                            "username", savedUser.getUsername()
                    ));

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Registration failed: " + e.getMessage()));
        }
    }

    @GetMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestParam String token) {
        try {
            String username = jwtUtil.extractUsername(token);
            if (username != null && jwtUtil.validateToken(token, username)) {
                User user = userRepository.findByUsername(username).orElse(null);
                if (user != null) {
                    return ResponseEntity.ok(Map.of(
                            "valid", true,
                            "username", username,
                            "role", user.getRole(),
                            "userId", user.getId()
                    ));
                }
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("valid", false, "error", "Invalid token"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("valid", false, "error", "Invalid token"));
        }
    }
}