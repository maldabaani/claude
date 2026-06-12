package com.helpdesk.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AutomationRuleApiTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    private String adminToken;
    private String agentToken;
    private String customerToken;

    @BeforeEach
    void auth() throws Exception {
        adminToken = obtainToken("admin@helpdesk.com", "Admin@123");
        agentToken = obtainToken("agent@helpdesk.com", "Agent@123");
        customerToken = obtainToken("customer@helpdesk.com", "Customer@123");
    }

    // ── Access Control ────────────────────────────────────────────────────────

    @Test
    void getAll_asAdmin_returns200() throws Exception {
        mockMvc.perform(get("/api/v1/automation-rules")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    void getAll_asCustomer_returns403() throws Exception {
        mockMvc.perform(get("/api/v1/automation-rules")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void getAll_asAgent_returns403() throws Exception {
        mockMvc.perform(get("/api/v1/automation-rules")
                        .header("Authorization", "Bearer " + agentToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void getAll_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/automation-rules"))
                .andExpect(status().isUnauthorized());
    }

    // ── Create ────────────────────────────────────────────────────────────────

    @Test
    @Order(1)
    void create_asAdmin_returns200AndPersists() throws Exception {
        String body = """
                {
                  "name": "Auto-close stale tickets",
                  "active": true,
                  "triggerType": "TIME",
                  "triggerHours": 72,
                  "conditions": "[]",
                  "actions": "[]",
                  "runOrder": 1
                }
                """;
        mockMvc.perform(post("/api/v1/automation-rules")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Auto-close stale tickets"))
                .andExpect(jsonPath("$.data.id").isNumber())
                .andExpect(jsonPath("$.data.active").value(true));
    }

    @Test
    void create_asCustomer_returns403() throws Exception {
        mockMvc.perform(post("/api/v1/automation-rules")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"x","triggerType":"EVENT","conditions":"[]","actions":"[]"}
                                """))
                .andExpect(status().isForbidden());
    }

    // ── Toggle ────────────────────────────────────────────────────────────────

    @Test
    @Order(2)
    void toggle_asAdmin_flipsActiveFlag() throws Exception {
        // Create a rule first
        String createBody = """
                {"name":"Toggle Me","active":true,"triggerType":"EVENT",
                 "triggerEvent":"TICKET_CREATED","conditions":"[]","actions":"[]","runOrder":0}
                """;
        MvcResult created = mockMvc.perform(post("/api/v1/automation-rules")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody))
                .andExpect(status().isOk())
                .andReturn();

        long id = objectMapper.readTree(created.getResponse().getContentAsString())
                .at("/data/id").asLong();

        // Toggle off
        mockMvc.perform(patch("/api/v1/automation-rules/" + id + "/toggle")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.active").value(false));

        // Toggle back on
        mockMvc.perform(patch("/api/v1/automation-rules/" + id + "/toggle")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.active").value(true));
    }

    // ── Update ────────────────────────────────────────────────────────────────

    @Test
    @Order(3)
    void update_asAdmin_appliesChanges() throws Exception {
        long id = createRule("Update Target");

        String updateBody = """
                {"name":"Updated Name","active":false,"triggerType":"TIME",
                 "triggerHours":48,"conditions":"[]","actions":"[]","runOrder":5}
                """;
        mockMvc.perform(put("/api/v1/automation-rules/" + id)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Updated Name"))
                .andExpect(jsonPath("$.data.active").value(false))
                .andExpect(jsonPath("$.data.triggerHours").value(48))
                .andExpect(jsonPath("$.data.runOrder").value(5));
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    @Test
    @Order(4)
    void delete_asAdmin_softDeletesRule() throws Exception {
        long id = createRule("To Be Deleted");

        mockMvc.perform(delete("/api/v1/automation-rules/" + id)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Automation rule deleted"));

        // Rule should no longer appear in the list
        MvcResult list = mockMvc.perform(get("/api/v1/automation-rules")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn();
        String listJson = list.getResponse().getContentAsString();
        // Deleted rule's id should not appear
        org.assertj.core.api.Assertions.assertThat(listJson)
                .doesNotContain("\"id\":" + id + ",\"name\":\"To Be Deleted\"");
    }

    @Test
    void delete_asCustomer_returns403() throws Exception {
        mockMvc.perform(delete("/api/v1/automation-rules/999")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private long createRule(String name) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/automation-rules")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("""
                                {"name":"%s","active":true,"triggerType":"EVENT",
                                 "triggerEvent":"TICKET_CREATED","conditions":"[]","actions":"[]","runOrder":0}
                                """, name)))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).at("/data/id").asLong();
    }

    private String obtainToken(String email, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("{\"email\":\"%s\",\"password\":\"%s\"}", email, password)))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).at("/data/accessToken").asText();
    }
}
