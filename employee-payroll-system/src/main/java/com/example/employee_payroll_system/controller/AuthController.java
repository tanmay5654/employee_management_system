package com.example.employee_payroll_system.controller;

import com.example.employee_payroll_system.dto.AuthRequest;
import com.example.employee_payroll_system.dto.AuthResponse;
import com.example.employee_payroll_system.dto.RegisterRequest;
import com.example.employee_payroll_system.model.User;
import com.example.employee_payroll_system.repository.UserRepository;
import com.example.employee_payroll_system.security.JwtUtil;
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
            // Check if username exists
            if (userRepository.existsByUsername(registerRequest.getUsername())) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Username already exists"));
            }

            // Check if email exists
            if (userRepository.existsByEmail(registerRequest.getEmail())) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Email already exists"));
            }

            // Create new user
            User user = new User();
            user.setUsername(registerRequest.getUsername());
            user.setEmail(registerRequest.getEmail());
            user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
            user.setFullName(registerRequest.getFullName());
            user.setRole(registerRequest.getRole() != null ? registerRequest.getRole() : "EMPLOYEE");

            User savedUser = userRepository.save(user);


            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of(
                            "message", "User registered successfully",
                            "userId", savedUser.getId(),
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