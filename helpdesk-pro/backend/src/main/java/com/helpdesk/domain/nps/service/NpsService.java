package com.helpdesk.domain.nps.service;

import com.helpdesk.domain.nps.dto.NpsRequest;
import com.helpdesk.domain.nps.dto.NpsResponseDto;
import com.helpdesk.domain.nps.dto.NpsScoreDto;
import com.helpdesk.domain.nps.entity.NpsResponse;
import com.helpdesk.domain.nps.repository.NpsResponseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NpsService {

    private final NpsResponseRepository npsRepository;

    @Transactional
    public NpsResponseDto submit(UUID ticketId, UUID customerId, NpsRequest request) {
        npsRepository.findByTicketId(ticketId).ifPresent(existing -> {
            throw new IllegalStateException("NPS already submitted for this ticket");
        });
        NpsResponse entity = NpsResponse.builder()
                .ticketId(ticketId)
                .customerId(customerId)
                .score(request.score())
                .comment(request.comment())
                .build();
        entity = npsRepository.save(entity);
        return toDto(entity);
    }

    @Transactional(readOnly = true)
    public Optional<NpsResponseDto> getByTicket(UUID ticketId) {
        return npsRepository.findByTicketId(ticketId).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public NpsScoreDto getScore(Instant from, Instant to) {
        long promoters = npsRepository.countPromoters(from, to);
        long passives = npsRepository.countPassives(from, to);
        long detractors = npsRepository.countDetractors(from, to);
        long total = promoters + passives + detractors;

        double promoterPct = total > 0 ? (promoters * 100.0 / total) : 0;
        double passivePct = total > 0 ? (passives * 100.0 / total) : 0;
        double detractorPct = total > 0 ? (detractors * 100.0 / total) : 0;
        int npsScore = (int) Math.round(promoterPct - detractorPct);

        return new NpsScoreDto(npsScore, promoters, passives, detractors, total, promoterPct, passivePct, detractorPct);
    }

    @Transactional(readOnly = true)
    public List<NpsResponseDto> getResponses(Instant from, Instant to) {
        return npsRepository.findByDateRange(from, to).stream().map(this::toDto).toList();
    }

    private NpsResponseDto toDto(NpsResponse e) {
        return new NpsResponseDto(e.getId(), e.getTicketId(), e.getScore(), e.getComment(), e.getSubmittedAt());
    }
}
