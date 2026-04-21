package com.example.employee_payroll_system.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    public void sendEmployeeCredentials(String toEmail, String fullName,
                                         String username, String password) {
        if (mailSender == null || mailUsername.isBlank()) {
            // Email not configured — skip silently
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailUsername);
            message.setTo(toEmail);
            message.setSubject("Welcome to Employee Management System — Your Login Details");
            message.setText(
                "Hi " + fullName + ",\n\n" +
                "Your account has been created on the Employee Management System.\n\n" +
                "Your login credentials:\n" +
                "  Username : " + username + "\n" +
                "  Password : " + password + "\n\n" +
                "Please log in at http://localhost and change your password after first login.\n\n" +
                "— Employee Management System"
            );
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Email sending failed: " + e.getMessage());
        }
    }
}
