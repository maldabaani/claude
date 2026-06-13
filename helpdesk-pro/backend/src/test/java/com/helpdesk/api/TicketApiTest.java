package com.helpdesk.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TicketApiTest {

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

    // ── GET /tickets ──────────────────────────────────────────────────────────

    @Test
    void getTickets_withoutToken_returns4xx() throws Exception {
        mockMvc.perform(get("/api/v1/tickets"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void getTickets_asAdmin_returnsPagedResult() throws Exception {
        mockMvc.perform(get("/api/v1/tickets?page=0&size=10")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.totalElements").isNumber());
    }

    @Test
    void getTickets_asCustomer_onlyReturnsOwnTickets() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/tickets?page=0&size=50")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andReturn();

        var root = objectMapper.readTree(result.getResponse().getContentAsString());
        var content = root.at("/data/content");
        // Every returned ticket must be created by the customer themselves
        if (content.size() > 0) {
            content.forEach(ticket -> {
                var createdBy = ticket.at("/createdBy/email").asText();
                assertThat(createdBy).isEqualTo("customer@helpdesk.com");
            });
        }
    }

    @Test
    void getTickets_filterByStatus_returnsOnlyMatchingStatus() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/tickets?status=OPEN&page=0&size=50")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn();

        var content = objectMapper.readTree(result.getResponse().getContentAsString()).at("/data/content");
        content.forEach(ticket ->
                assertThat(ticket.at("/status").asText()).isEqualTo("OPEN"));
    }

    // ── POST /tickets ─────────────────────────────────────────────────────────

    @Test
    void createTicket_asCustomer_withValidBody_returns201() throws Exception {
        String body = """
                {
                  "title": "API Test Ticket",
                  "description": "Created via API test",
                  "priority": "MEDIUM"
                }
                """;
        mockMvc.perform(post("/api/v1/tickets")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.title").value("API Test Ticket"))
                .andExpect(jsonPath("$.data.status").value("NEW"))
                .andExpect(jsonPath("$.data.priority").value("MEDIUM"));
    }

    @Test
    void createTicket_asAgent_withValidBody_returns201() throws Exception {
        String body = """
                {"title":"Agent Created","description":"test","priority":"HIGH"}
                """;
        mockMvc.perform(post("/api/v1/tickets")
                        .header("Authorization", "Bearer " + agentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.title").value("Agent Created"));
    }

    @Test
    void createTicket_withBlankTitle_returns400() throws Exception {
        String body = """
                {"title":"","description":"desc","priority":"LOW"}
                """;
        mockMvc.perform(post("/api/v1/tickets")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createTicket_withMissingDescription_returns400() throws Exception {
        String body = """
                {"title":"No description"}
                """;
        mockMvc.perform(post("/api/v1/tickets")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createTicket_withoutToken_returns4xx() throws Exception {
        mockMvc.perform(post("/api/v1/tickets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Unauth","description":"test"}
                                """))
                .andExpect(status().is4xxClientError());
    }

    // ── GET /tickets/:id ──────────────────────────────────────────────────────

    @Test
    void getTicketById_existingTicket_returns200() throws Exception {
        // Create a ticket first
        String ticketId = createTicket(adminToken, "Detail Ticket", "Description");

        mockMvc.perform(get("/api/v1/tickets/" + ticketId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(ticketId))
                .andExpect(jsonPath("$.data.title").value("Detail Ticket"));
    }

    @Test
    void getTicketById_nonexistentId_returns404() throws Exception {
        mockMvc.perform(get("/api/v1/tickets/00000000-0000-0000-0000-000000000000")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
    }

    // ── PATCH /tickets/:id/status ──────────────────────────────────────────────

    @Test
    void changeStatus_asAgent_returns200() throws Exception {
        String ticketId = createTicket(adminToken, "Status Test Ticket", "Desc");

        mockMvc.perform(patch("/api/v1/tickets/" + ticketId + "/status")
                        .header("Authorization", "Bearer " + agentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"OPEN"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("OPEN"));
    }

    @Test
    void changeStatus_asCustomer_returns403() throws Exception {
        String ticketId = createTicket(adminToken, "Customer Status Test", "Desc");

        mockMvc.perform(patch("/api/v1/tickets/" + ticketId + "/status")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"CLOSED"}
                                """))
                .andExpect(status().isForbidden());
    }

    // ── Ticket Splitting (F19) ─────────────────────────────────────────────────

    @Test
    void splitTicket_asAgent_creates201WithLinkedTicket() throws Exception {
        String sourceId = createTicket(agentToken, "Source Ticket", "Original description");

        String splitBody = """
                {
                  "subject": "Split Part",
                  "description": "Moved to separate ticket",
                  "priority": "HIGH"
                }
                """;
        MvcResult result = mockMvc.perform(post("/api/v1/tickets/" + sourceId + "/split")
                        .header("Authorization", "Bearer " + agentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(splitBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.title").value("Split Part"))
                .andExpect(jsonPath("$.data.splitFromId").value(sourceId))
                .andReturn();

        // Verify the split ticket is retrievable
        String newTicketId = objectMapper.readTree(result.getResponse().getContentAsString())
                .at("/data/id").asText();
        mockMvc.perform(get("/api/v1/tickets/" + newTicketId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.splitFromId").value(sourceId));
    }

    @Test
    void splitTicket_asCustomer_returns403() throws Exception {
        String sourceId = createTicket(adminToken, "No Split For Customer", "Desc");

        mockMvc.perform(post("/api/v1/tickets/" + sourceId + "/split")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"subject":"split","description":"x"}
                                """))
                .andExpect(status().isForbidden());
    }

    // ── AI Triage suggestions (F-SmartTriage) ────────────────────────────────

    @Test
    void aiSuggestions_asAgent_returns200WithFallback() throws Exception {
        // Anthropic API key is a test placeholder so AiTriageService returns fallback
        String ticketId = createTicket(adminToken, "Cannot login to my account", "Error 401 every time I try");

        MvcResult result = mockMvc.perform(post("/api/v1/tickets/" + ticketId + "/ai-suggestions")
                        .header("Authorization", "Bearer " + agentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.category").isString())
                .andExpect(jsonPath("$.data.priority").isString())
                .andExpect(jsonPath("$.data.suggestedResponse").isString())
                .andReturn();

        var data = objectMapper.readTree(result.getResponse().getContentAsString()).at("/data");
        // Fallback values are expected when API key is invalid
        assertThat(data.at("/category").asText()).isNotBlank();
        assertThat(data.at("/priority").asText()).isNotBlank();
        assertThat(data.at("/suggestedResponse").asText()).isNotBlank();
    }

    @Test
    void aiSuggestions_asCustomer_returns403() throws Exception {
        String ticketId = createTicket(adminToken, "Test ticket", "Description");

        mockMvc.perform(post("/api/v1/tickets/" + ticketId + "/ai-suggestions")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void aiSuggestions_withUnknownTicketId_returns404() throws Exception {
        mockMvc.perform(post("/api/v1/tickets/00000000-0000-0000-0000-000000000000/ai-suggestions")
                        .header("Authorization", "Bearer " + agentToken))
                .andExpect(status().isNotFound());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String createTicket(String token, String title, String description) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/tickets")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("""
                                {"title":"%s","description":"%s","priority":"MEDIUM"}
                                """, title, description)))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).at("/data/id").asText();
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
