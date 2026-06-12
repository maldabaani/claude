package com.helpdesk.domain.automation;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AutomationRuleServiceTest {

    @Mock
    private AutomationRuleRepository repository;

    @InjectMocks
    private AutomationRuleService service;

    private AutomationRule sampleRule;

    @BeforeEach
    void setUp() {
        sampleRule = AutomationRule.builder()
                .id(1L)
                .name("Test Rule")
                .active(true)
                .triggerType("EVENT")
                .triggerEvent("TICKET_CREATED")
                .conditions("[]")
                .actions("[]")
                .runOrder(0)
                .deleted(false)
                .build();
    }

    // ── getAll ────────────────────────────────────────────────────────────────

    @Test
    void getAll_delegatesToFindByDeletedFalse() {
        when(repository.findByDeletedFalse()).thenReturn(List.of(sampleRule));

        List<AutomationRule> result = service.getAll();

        assertThat(result).hasSize(1).contains(sampleRule);
        verify(repository).findByDeletedFalse();
    }

    @Test
    void getAll_returnsEmptyListWhenNoRules() {
        when(repository.findByDeletedFalse()).thenReturn(List.of());

        assertThat(service.getAll()).isEmpty();
    }

    // ── create ────────────────────────────────────────────────────────────────

    @Test
    void create_setsCreatedAtAndUpdatedAt() {
        AutomationRule input = AutomationRule.builder()
                .name("New Rule")
                .triggerType("EVENT")
                .conditions("[]")
                .actions("[]")
                .build();
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Instant before = Instant.now();
        AutomationRule result = service.create(input);
        Instant after = Instant.now();

        assertThat(result.getCreatedAt()).isBetween(before, after);
        assertThat(result.getUpdatedAt()).isBetween(before, after);
    }

    @Test
    void create_savesAndReturnsRule() {
        when(repository.save(any())).thenReturn(sampleRule);

        AutomationRule result = service.create(sampleRule);

        assertThat(result).isEqualTo(sampleRule);
        verify(repository).save(sampleRule);
    }

    // ── update ────────────────────────────────────────────────────────────────

    @Test
    void update_throwsWhenRuleNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(99L, sampleRule))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("99");
    }

    @Test
    void update_appliesAllFieldsAndSetsUpdatedAt() {
        AutomationRule existing = AutomationRule.builder()
                .id(1L).name("Old").active(true).triggerType("EVENT")
                .conditions("[]").actions("[]").runOrder(0).deleted(false).build();
        AutomationRule updated = AutomationRule.builder()
                .name("Updated").active(false).triggerType("TIME")
                .triggerHours(24).conditions("[{\"field\":\"status\"}]")
                .actions("[{\"type\":\"assign\"}]").runOrder(5).build();

        when(repository.findById(1L)).thenReturn(Optional.of(existing));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        AutomationRule result = service.update(1L, updated);

        assertThat(result.getName()).isEqualTo("Updated");
        assertThat(result.isActive()).isFalse();
        assertThat(result.getTriggerType()).isEqualTo("TIME");
        assertThat(result.getTriggerHours()).isEqualTo(24);
        assertThat(result.getRunOrder()).isEqualTo(5);
        assertThat(result.getUpdatedAt()).isNotNull();
    }

    // ── toggle ────────────────────────────────────────────────────────────────

    @Test
    void toggle_flipsActiveFromTrueToFalse() {
        sampleRule.setActive(true);
        when(repository.findById(1L)).thenReturn(Optional.of(sampleRule));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        AutomationRule result = service.toggle(1L);

        assertThat(result.isActive()).isFalse();
    }

    @Test
    void toggle_flipsActiveFromFalseToTrue() {
        sampleRule.setActive(false);
        when(repository.findById(1L)).thenReturn(Optional.of(sampleRule));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        AutomationRule result = service.toggle(1L);

        assertThat(result.isActive()).isTrue();
    }

    @Test
    void toggle_throwsWhenNotFound() {
        when(repository.findById(42L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.toggle(42L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("42");
    }

    @Test
    void toggle_updatesUpdatedAt() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleRule));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Instant before = Instant.now();
        service.toggle(1L);
        Instant after = Instant.now();

        ArgumentCaptor<AutomationRule> captor = ArgumentCaptor.forClass(AutomationRule.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getUpdatedAt()).isBetween(before, after);
    }

    // ── delete ────────────────────────────────────────────────────────────────

    @Test
    void delete_setsDeletedTrue() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleRule));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.delete(1L);

        ArgumentCaptor<AutomationRule> captor = ArgumentCaptor.forClass(AutomationRule.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().isDeleted()).isTrue();
    }

    @Test
    void delete_doesNothingWhenNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatCode(() -> service.delete(99L)).doesNotThrowAnyException();
        verify(repository, never()).save(any());
    }

    @Test
    void delete_setsUpdatedAt() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleRule));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Instant before = Instant.now();
        service.delete(1L);
        Instant after = Instant.now();

        ArgumentCaptor<AutomationRule> captor = ArgumentCaptor.forClass(AutomationRule.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getUpdatedAt()).isBetween(before, after);
    }
}
