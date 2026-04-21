package com.example.employee_payroll_system.config;

import com.example.employee_payroll_system.security.AuditLoggingFilter;
import com.example.employee_payroll_system.security.CustomUserDetailsService;
import com.example.employee_payroll_system.security.JwtAuthFilter;
import com.example.employee_payroll_system.security.RateLimitFilter;
import com.example.employee_payroll_system.security.SecurityHeadersFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthFilter jwtAuthFilter;

    @Autowired
    private RateLimitFilter rateLimitFilter;

    @Autowired
    private AuditLoggingFilter auditLoggingFilter;

    @Autowired
    private SecurityHeadersFilter securityHeadersFilter;

    @Bean
    public UserDetailsService userDetailsService() {
        return new CustomUserDetailsService();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    @SuppressWarnings("deprecation") // DaoAuthenticationProvider constructors deprecated in Spring Security 6.4 (still functional)
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(passwordEncoder());
        provider.setUserDetailsService(userDetailsService());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    // Prevent @Component filters from also being auto-registered as raw servlet filters
    // (they are managed exclusively inside the Spring Security filter chain below)
    @Bean
    public FilterRegistrationBean<RateLimitFilter> rateLimitRegistration() {
        FilterRegistrationBean<RateLimitFilter> reg = new FilterRegistrationBean<>(rateLimitFilter);
        reg.setEnabled(false);
        return reg;
    }

    @Bean
    public FilterRegistrationBean<AuditLoggingFilter> auditLoggingRegistration() {
        FilterRegistrationBean<AuditLoggingFilter> reg = new FilterRegistrationBean<>(auditLoggingFilter);
        reg.setEnabled(false);
        return reg;
    }

    @Bean
    public FilterRegistrationBean<SecurityHeadersFilter> securityHeadersRegistration() {
        FilterRegistrationBean<SecurityHeadersFilter> reg = new FilterRegistrationBean<>(securityHeadersFilter);
        reg.setEnabled(false);
        return reg;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/public/**").permitAll()
                        .requestMatchers("/api/employees/**").authenticated()
                        .requestMatchers("/api/timesheets/**").authenticated()
                        .requestMatchers("/api/rosters/**").authenticated()
                        .requestMatchers("/api/ai/**").authenticated()
                        .requestMatchers("/api/analytics/**").authenticated()
                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider())
                // Order: SecurityHeaders → RateLimit → JWT → AuditLog
                .addFilterBefore(securityHeadersFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(auditLoggingFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }
}
