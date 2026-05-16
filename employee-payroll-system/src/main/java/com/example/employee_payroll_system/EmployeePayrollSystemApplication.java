package com.example.employee_payroll_system;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@EnableAsync
@SpringBootApplication
public class EmployeePayrollSystemApplication {

	public static void main(String[] args) {
		SpringApplication.run(EmployeePayrollSystemApplication.class, args);
	}

}
