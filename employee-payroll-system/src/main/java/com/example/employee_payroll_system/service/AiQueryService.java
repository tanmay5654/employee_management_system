package com.example.employee_payroll_system.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.regex.Pattern;

@Service
public class AiQueryService {

    @Value("${groq.api.key:}")
    private String groqApiKey;

    @PersistenceContext
    private EntityManager entityManager;

    private static final String GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final String GROQ_MODEL = "llama-3.3-70b-versatile";

    private static final String SCHEMA_CONTEXT =
        "You are a PostgreSQL SQL generator for an Employee Management System.\n\n" +
        "Database schema:\n\n" +
        "employees (id, employee_code, first_name, last_name, email, phone, hourly_rate,\n" +
        "           department, position, is_active, role, managed_department,\n" +
        "           created_at, updated_at)\n\n" +
        "time_entries (id, employee_id, clock_in, clock_out, break_minutes,\n" +
        "              total_hours, date, notes)\n\n" +
        "rosters (id, employee_id, manager_id, shift_date, start_time, end_time,\n" +
        "         break_duration, total_shift_hours, shift_type, department,\n" +
        "         status, created_at, updated_at)\n\n" +
        "users (id, username, password, role)\n\n" +
        "Rules:\n" +
        "- Return ONLY a raw SQL SELECT statement — no markdown, no explanation, no code blocks.\n" +
        "- Never generate INSERT, UPDATE, DELETE, DROP, ALTER, or TRUNCATE.\n" +
        "- Use standard PostgreSQL syntax.\n" +
        "- For 'this week' use: DATE_TRUNC('week', CURRENT_DATE).\n" +
        "- For 'last week' use: DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '7 days'.\n" +
        "- For 'overtime' assume total_hours > 8 per day.\n" +
        "- Always join employees table when showing names.";

    // Block any destructive SQL
    private static final Pattern UNSAFE_PATTERN = Pattern.compile(
        "(?i)\\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|GRANT|REVOKE|EXEC|EXECUTE)\\b"
    );

    public Map<String, Object> processNaturalLanguageQuery(String naturalLanguageQuery) {
        Map<String, Object> result = new HashMap<>();

        if (groqApiKey == null || groqApiKey.isBlank()) {
            result.put("error", "AI feature not configured. Set GROQ_API_KEY environment variable.");
            return result;
        }

        try {
            String sql = generateSqlFromNaturalLanguage(naturalLanguageQuery);

            // Strip markdown code blocks if model added them
            sql = sql.replaceAll("```sql", "").replaceAll("```", "").trim();
            result.put("generatedSql", sql);

            if (UNSAFE_PATTERN.matcher(sql).find()) {
                result.put("error", "Generated query contained unsafe operations and was rejected.");
                return result;
            }

            List<Map<String, Object>> rows = executeQuery(sql);
            result.put("data", rows);
            result.put("rowCount", rows.size());
            result.put("query", naturalLanguageQuery);

        } catch (Exception e) {
            result.put("error", "Query failed: " + e.getMessage());
        }

        return result;
    }

    private String generateSqlFromNaturalLanguage(String question) {
        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + groqApiKey);

        // Groq uses OpenAI-compatible format
        Map<String, Object> systemMessage = Map.of("role", "system", "content", SCHEMA_CONTEXT);
        Map<String, Object> userMessage = Map.of("role", "user", "content", question);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", GROQ_MODEL);
        body.put("max_tokens", 512);
        body.put("temperature", 0);
        body.put("messages", List.of(systemMessage, userMessage));

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        @SuppressWarnings("unchecked")
        ResponseEntity<Map<String, Object>> response =
            (ResponseEntity<Map<String, Object>>) (ResponseEntity<?>) restTemplate
                .postForEntity(GROQ_API_URL, request, Map.class);

        Map<String, Object> responseBody = response.getBody();
        if (responseBody == null) {
            throw new RuntimeException("Empty response from Groq API");
        }

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
        @SuppressWarnings("unchecked")
        Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
        String sql = (String) message.get("content");
        return sql.trim();
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> executeQuery(String sql) {
        Query query = entityManager.createNativeQuery(sql);
        query.setMaxResults(200);

        List<Object[]> rawResults = query.getResultList();
        List<Map<String, Object>> rows = new ArrayList<>();

        for (Object rawRow : rawResults) {
            Map<String, Object> row = new LinkedHashMap<>();
            if (rawRow instanceof Object[] cols) {
                for (int i = 0; i < cols.length; i++) {
                    row.put("col" + i, cols[i] != null ? cols[i].toString() : null);
                }
            } else {
                row.put("col0", rawRow != null ? rawRow.toString() : null);
            }
            rows.add(row);
        }
        return rows;
    }
}
