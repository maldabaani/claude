package com.helpdesk.domain.ticket;

import com.helpdesk.domain.audit.service.AuditLogService;
import com.helpdesk.domain.comment.repository.CommentRepository;
import com.helpdesk.domain.csat.repository.CsatRatingRepository;
import com.helpdesk.domain.helptopic.HelpTopicRepository;
import com.helpdesk.domain.notification.service.NotificationService;
import com.helpdesk.domain.roundrobin.RoundRobinService;
import com.helpdesk.domain.settings.repository.SystemSettingRepository;
import com.helpdesk.domain.sla.repository.SlaPolicyRepository;
import com.helpdesk.domain.team.TeamRepository;
import com.helpdesk.domain.ticket.dto.CreateTicketRequest;
import com.helpdesk.domain.ticket.dto.TicketSplitRequest;
import com.helpdesk.domain.ticket.entity.Priority;
import com.helpdesk.domain.ticket.entity.Ticket;
import com.helpdesk.domain.ticket.entity.TicketStatus;
import com.helpdesk.domain.ticket.repository.TicketRepository;
import com.helpdesk.domain.ticket.service.TicketNumberGenerator;
import com.helpdesk.domain.ticket.service.TicketService;
import com.helpdesk.domain.user.entity.Role;
import com.helpdesk.domain.user.entity.User;
import com.helpdesk.domain.user.repository.UserRepository;
import com.helpdesk.domain.user.service.UserService;
import com.helpdesk.domain.webhook.WebhookService;
import com.helpdesk.shared.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TicketServiceTest {

    @Mock TicketRepository ticketRepository;
    @Mock UserRepository userRepository;
    @Mock SlaPolicyRepository slaPolicyRepository;
    @Mock TicketNumberGenerator ticketNumberGenerator;
    @Mock NotificationService notificationService;
    @Mock UserService userService;
    @Mock AuditLogService auditLogService;
    @Mock CommentRepository commentRepository;
    @Mock CsatRatingRepository csatRatingRepository;
    @Mock SystemSettingRepository systemSettingRepository;
    @Mock WebhookService webhookService;
    @Mock HelpTopicRepository helpTopicRepository;
    @Mock RoundRobinService roundRobinService;
    @Mock TeamRepository teamRepository;

    @InjectMocks
    TicketService ticketService;

    private User customer;
    private User admin;

    @BeforeEach
    void setUp() {
        customer = User.builder()
                .id(UUID.randomUUID())
                .email("customer@test.com")
                .fullName("Test Customer")
                .role(Role.CUSTOMER)
                .passwordHash("hash")
                .build();

        admin = User.builder()
                .id(UUID.randomUUID())
                .email("admin@test.com")
                .fullName("Test Admin")
                .role(Role.ADMIN)
                .passwordHash("hash")
                .build();
    }

    // ── create ────────────────────────────────────────────────────────────────

    @Test
    void create_setsStatusToNew() {
        when(ticketNumberGenerator.generate()).thenReturn("TKT-001");
        when(slaPolicyRepository.findByPriorityAndDeletedAtIsNull(any())).thenReturn(Optional.empty());
        when(systemSettingRepository.findById(any())).thenReturn(Optional.empty());
        when(roundRobinService.getNextAgent(any())).thenReturn(Optional.empty());
        when(ticketRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.findById(any())).thenReturn(Optional.empty());

        var request = new CreateTicketRequest("My ticket", "Description", null, null, null, null, null);
        var result = ticketService.create(request, customer);

        assertThat(result.status()).isEqualTo(TicketStatus.NEW);
    }

    @Test
    void create_setsCreatedByIdFromCurrentUser() {
        when(ticketNumberGenerator.generate()).thenReturn("TKT-002");
        when(slaPolicyRepository.findByPriorityAndDeletedAtIsNull(any())).thenReturn(Optional.empty());
        when(systemSettingRepository.findById(any())).thenReturn(Optional.empty());
        when(roundRobinService.getNextAgent(any())).thenReturn(Optional.empty());
        when(ticketRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.findById(any())).thenReturn(Optional.of(customer));

        var request = new CreateTicketRequest("Title", "Desc", null, null, null, null, null);
        ticketService.create(request, customer);

        var captor = org.mockito.ArgumentCaptor.forClass(Ticket.class);
        verify(ticketRepository).save(captor.capture());
        assertThat(captor.getValue().getCreatedById()).isEqualTo(customer.getId());
    }

    @Test
    void create_defaultsPriorityToMediumWhenNull() {
        when(ticketNumberGenerator.generate()).thenReturn("TKT-003");
        when(slaPolicyRepository.findByPriorityAndDeletedAtIsNull(any())).thenReturn(Optional.empty());
        when(systemSettingRepository.findById(any())).thenReturn(Optional.empty());
        when(roundRobinService.getNextAgent(any())).thenReturn(Optional.empty());
        when(ticketRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.findById(any())).thenReturn(Optional.empty());

        var request = new CreateTicketRequest("Title", "Desc", null, null, null, null, null);
        var result = ticketService.create(request, customer);

        assertThat(result.priority()).isEqualTo(Priority.MEDIUM);
    }

    @Test
    void create_usesProvidedPriority() {
        when(ticketNumberGenerator.generate()).thenReturn("TKT-004");
        when(slaPolicyRepository.findByPriorityAndDeletedAtIsNull(any())).thenReturn(Optional.empty());
        when(systemSettingRepository.findById(any())).thenReturn(Optional.empty());
        when(roundRobinService.getNextAgent(any())).thenReturn(Optional.empty());
        when(ticketRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.findById(any())).thenReturn(Optional.empty());

        var request = new CreateTicketRequest("Title", "Desc", Priority.CRITICAL, null, null, null, null);
        var result = ticketService.create(request, customer);

        assertThat(result.priority()).isEqualTo(Priority.CRITICAL);
    }

    @Test
    void create_firesAuditLogAndWebhook() {
        when(ticketNumberGenerator.generate()).thenReturn("TKT-005");
        when(slaPolicyRepository.findByPriorityAndDeletedAtIsNull(any())).thenReturn(Optional.empty());
        when(systemSettingRepository.findById(any())).thenReturn(Optional.empty());
        when(roundRobinService.getNextAgent(any())).thenReturn(Optional.empty());
        Ticket saved = Ticket.builder().id(UUID.randomUUID()).ticketNumber("TKT-005")
                .title("T").description("D").createdById(customer.getId()).build();
        when(ticketRepository.save(any())).thenReturn(saved);
        when(userRepository.findById(any())).thenReturn(Optional.empty());

        ticketService.create(new CreateTicketRequest("T", "D", null, null, null, null, null), customer);

        verify(auditLogService).log(eq("TICKET"), any(), eq("CREATED"), eq(customer.getId()));
        verify(webhookService).fireEvent(eq("ticket.created"), any());
    }

    // ── findById ──────────────────────────────────────────────────────────────

    @Test
    void findById_throwsResourceNotFoundWhenMissing() {
        UUID id = UUID.randomUUID();
        when(ticketRepository.findByIdAndDeletedAtIsNull(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> ticketService.findById(id))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void findById_returnsResponseWhenFound() {
        UUID id = UUID.randomUUID();
        Ticket ticket = Ticket.builder().id(id).ticketNumber("TKT-010")
                .title("Found").description("Desc").createdById(customer.getId()).build();
        when(ticketRepository.findByIdAndDeletedAtIsNull(id)).thenReturn(Optional.of(ticket));
        when(userRepository.findById(any())).thenReturn(Optional.empty());

        var result = ticketService.findById(id);

        assertThat(result.id()).isEqualTo(id);
        assertThat(result.title()).isEqualTo("Found");
    }

    // ── splitTicket ───────────────────────────────────────────────────────────

    @Test
    void splitTicket_createsNewTicketLinkedToSource() {
        UUID sourceId = UUID.randomUUID();
        Ticket source = Ticket.builder().id(sourceId).ticketNumber("TKT-SRC")
                .title("Source").description("Source desc").createdById(customer.getId())
                .priority(Priority.HIGH).build();

        when(ticketRepository.findByIdAndDeletedAtIsNull(sourceId)).thenReturn(Optional.of(source));
        when(ticketNumberGenerator.generate()).thenReturn("TKT-NEW");
        when(ticketRepository.save(any())).thenAnswer(inv -> {
            Ticket t = inv.getArgument(0);
            if (t.getId() == null) t = Ticket.builder().id(UUID.randomUUID())
                    .ticketNumber(t.getTicketNumber()).title(t.getTitle())
                    .description(t.getDescription() != null ? t.getDescription() : "")
                    .createdById(t.getCreatedById()).priority(t.getPriority())
                    .splitFrom(t.getSplitFrom()).build();
            return t;
        });
        when(commentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.findById(any())).thenReturn(Optional.empty());

        TicketSplitRequest request = new TicketSplitRequest();
        request.setSubject("Split ticket");
        request.setDescription("Split description");

        var result = ticketService.splitTicket(sourceId, request, admin.getId());

        assertThat(result.title()).isEqualTo("Split ticket");
        // Two internal comments should be saved: one on source, one on new ticket
        verify(commentRepository, atLeast(2)).save(any());
        verify(auditLogService).log(eq("TICKET"), eq(sourceId), eq("SPLIT"), eq(admin.getId()), any(), any());
    }

    @Test
    void splitTicket_inheritsPriorityFromSourceWhenNotProvided() {
        UUID sourceId = UUID.randomUUID();
        Ticket source = Ticket.builder().id(sourceId).ticketNumber("TKT-SRC2")
                .title("Source").description("Desc").createdById(customer.getId())
                .priority(Priority.HIGH).build();

        when(ticketRepository.findByIdAndDeletedAtIsNull(sourceId)).thenReturn(Optional.of(source));
        when(ticketNumberGenerator.generate()).thenReturn("TKT-CHD");
        when(ticketRepository.save(any())).thenAnswer(inv -> {
            Ticket t = inv.getArgument(0);
            if (t.getId() == null) {
                return Ticket.builder().id(UUID.randomUUID()).ticketNumber("TKT-CHD")
                        .title(t.getTitle()).description(t.getDescription() != null ? t.getDescription() : "")
                        .createdById(t.getCreatedById()).priority(t.getPriority())
                        .splitFrom(source).build();
            }
            return t;
        });
        when(commentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.findById(any())).thenReturn(Optional.empty());

        TicketSplitRequest request = new TicketSplitRequest();
        // No priority set — should inherit from source

        var result = ticketService.splitTicket(sourceId, request, admin.getId());

        assertThat(result.priority()).isEqualTo(Priority.HIGH);
    }
}
