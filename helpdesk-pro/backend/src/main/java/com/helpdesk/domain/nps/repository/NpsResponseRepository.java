package com.helpdesk.domain.nps.repository;

import com.helpdesk.domain.nps.entity.NpsResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NpsResponseRepository extends JpaRepository<NpsResponse, UUID> {

    Optional<NpsResponse> findByTicketId(UUID ticketId);

    List<NpsResponse> findByCustomerId(UUID customerId);

    @Query("SELECT n FROM NpsResponse n WHERE n.submittedAt >= :from AND n.submittedAt <= :to ORDER BY n.submittedAt DESC")
    List<NpsResponse> findByDateRange(@Param("from") Instant from, @Param("to") Instant to);

    @Query("SELECT COUNT(n) FROM NpsResponse n WHERE n.submittedAt >= :from AND n.submittedAt <= :to AND n.score >= 9")
    long countPromoters(@Param("from") Instant from, @Param("to") Instant to);

    @Query("SELECT COUNT(n) FROM NpsResponse n WHERE n.submittedAt >= :from AND n.submittedAt <= :to AND n.score >= 7 AND n.score <= 8")
    long countPassives(@Param("from") Instant from, @Param("to") Instant to);

    @Query("SELECT COUNT(n) FROM NpsResponse n WHERE n.submittedAt >= :from AND n.submittedAt <= :to AND n.score <= 6")
    long countDetractors(@Param("from") Instant from, @Param("to") Instant to);
}
