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

    @Value("${app.frontend.url:https://pizzaco-frontend.onrender.com}")
    private String frontendUrl;

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
            message.setSubject("Welcome to PizzaCo Staff — Your Login Details");
            message.setText(
                "Hi " + fullName + ",\n\n" +
                "Your account has been created on the PizzaCo Staff portal.\n\n" +
                "Your login credentials:\n" +
                "  Username : " + username + "\n" +
                "  Password : " + password + "\n\n" +
                "Please log in at: " + frontendUrl + "\n\n" +
                "Use the above credentials to sign in. " +
                "Your password is a 4-digit number — keep it safe.\n\n" +
                "— PizzaCo Staff Team"
            );
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Email sending failed: " + e.getMessage());
        }
    }
}
