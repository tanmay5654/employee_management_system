package com.example.employee_payroll_system.controller;

import com.example.employee_payroll_system.service.AiQueryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AiQueryController {

    @Autowired
    private AiQueryService aiQueryService;

    /**
     * POST /api/ai/query
     * Body: { "query": "Show me all employees who worked overtime last week" }
     * Returns: { "query", "generatedSql", "data": [...], "rowCount" }
     */
    @PostMapping("/query")
    public ResponseEntity<Map<String, Object>> naturalLanguageQuery(
            @RequestBody Map<String, String> body) {

        String query = body.get("query");
        if (query == null || query.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Query cannot be empty"));
        }

        Map<String, Object> result = aiQueryService.processNaturalLanguageQuery(query);

        if (result.containsKey("error")) {
            return ResponseEntity.badRequest().body(result);
        }

        return ResponseEntity.ok(result);
    }
}
